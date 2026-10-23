import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import Header from '@/components/Header';
import DrawerButton from '@/components/DrawerButton';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, Configuracion, Mensaje, ResumenConversacion } from '@/lib/api';
import { detenerVoz, hablar } from '@/lib/voz';
import { useGrabadorVoz } from '@/lib/grabacion';
import { etiquetaConfig, idiomaDeEntrega } from '@/lib/reglas';
import { useConversaciones } from '@/app/contexts/ConversacionesContext';
import MessageBubble from './MessageBubble';
import TranslatorInput, { EnvioMensaje, Remitente } from './TranslatorInput';
import BurbujaVoz, { UltimoIntercambio } from './BurbujaVoz';
import PromptModal from './PromptModal';

type Modo = 'burbuja' | 'chat';
const CLAVE_MODO = 'talklate.modo';


// Pantalla del traductor. Dos modos que se cambian desde la cabecera (como ChatGPT): la burbuja de voz
// animada que representa a la IA, o el chat con los mensajes originales y traducidos.
export default function ChatView({ id }: { id: string }) {
  const { refrescar } = useConversaciones();
  const [conv, setConv] = useState<ResumenConversacion | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [renombrando, setRenombrando] = useState(false);
  const [errorNombre, setErrorNombre] = useState('');
  const [reportando, setReportando] = useState<Mensaje | null>(null);
  const [errorReporte, setErrorReporte] = useState('');
  const lista = useRef<ScrollView>(null);
  const [modo, setModo] = useState<Modo>('burbuja');
  const [remitente, setRemitente] = useState<Remitente>('usuario');
  const [estadoVoz, setEstadoVoz] = useState<'lista' | 'traduciendo' | 'hablando'>('lista');
  const [ultimo, setUltimo] = useState<UltimoIntercambio>(null);
  const grabador = useGrabadorVoz();

  // Se recuerda el ultimo modo elegido en este celular
  useEffect(() => {
    AsyncStorage.getItem(CLAVE_MODO).then((m) => { if (m === 'chat' || m === 'burbuja') setModo(m); }).catch(() => {});
  }, []);
  const cambiarModo = () => {
    const nuevo: Modo = modo === 'burbuja' ? 'chat' : 'burbuja';
    setModo(nuevo);
    AsyncStorage.setItem(CLAVE_MODO, nuevo).catch(() => {});
  };

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { mensajes: lista, ...resumen } = await api.conversacion(id);
      setConv(resumen);
      setMensajes(lista);
      setAviso(null);
    } catch (e: any) {
      setAviso(e.message);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { setTimeout(() => lista.current?.scrollToEnd({ animated: true }), 50); }, [mensajes.length]);

  // El audio se reproduce en el idioma/pais en que quedo la traduccion, con la entonacion del mensaje
  // y, si fue hablado, a la velocidad con que hablo la persona
  const reproducir = (m: Mensaje, config: Configuracion, opciones: { ritmo?: number; alTerminar?: () => void } = {}) => {
    if (!m.traduccion) return opciones.alTerminar?.();
    const hacia = idiomaDeEntrega(m.remitente, config);
    if (hacia) hablar(m.traduccion.contenido, hacia.codigo, hacia.pais, m.tono, opciones);
    else opciones.alTerminar?.();
  };

  // Microfono (burbuja o chat): un toque empieza a grabar; el siguiente envia el audio, que el servidor
  // transcribe y traduce; la traduccion se escucha con la misma entonacion.
  const pulsarMicrofono = async () => {
    if (!conv) return;
    if (estadoVoz === 'hablando') { detenerVoz(); setEstadoVoz('lista'); return; }
    if (!grabador.grabando) {
      setAviso(null);
      try { await grabador.iniciar(); } catch (err: any) { setAviso(err.message); }
      return;
    }
    let grabacion;
    try {
      grabacion = await grabador.detener();
    } catch (err: any) {
      setAviso(err.message);
      return;
    }
    if (!grabacion) { setAviso('El audio fue muy corto. Toca la burbuja, habla y vuelve a tocarla.'); return; }
    setEstadoVoz('traduciendo');
    setEnviando(true);
    try {
      const r = await api.enviarMensajeVoz(id, { ...grabacion, remitente });
      setMensajes((ms) => [...ms, r.mensaje]);
      setConv({ ...conv, configuracion: r.configuracion, total_mensajes: conv.total_mensajes + 1 });
      setUltimo({ original: r.transcripcion, traduccion: r.mensaje.traduccion?.contenido || '', tono: r.mensaje.tono, remitente });
      if (r.aviso) setAviso(r.aviso);
      setEstadoVoz('hablando');
      reproducir(r.mensaje, r.configuracion, { ritmo: r.entrega.ritmo_voz, alTerminar: () => setEstadoVoz('lista') });
      refrescar();
    } catch (err: any) {
      setAviso(err.message);
      setEstadoVoz('lista');
    } finally {
      setEnviando(false);
    }
  };

  const enviar = async (e: EnvioMensaje) => {
    if (!conv) return;
    setEnviando(true);
    setAviso(null);
    try {
      const r = await api.enviarMensaje(id, e);
      setMensajes((ms) => [...ms, r.mensaje]);
      setConv({ ...conv, configuracion: r.configuracion, total_mensajes: conv.total_mensajes + 1 });
      if (r.aviso) setAviso(r.aviso);
      // Se entrega por el mismo canal en que llego: si hablaste, la traduccion se escucha
      if (r.entrega.reproducir_audio) reproducir(r.mensaje, r.configuracion);
      refrescar();
    } catch (err: any) {
      setAviso(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const renombrar = async (nombre: string) => {
    try {
      setConv(await api.renombrar(id, nombre));
      setRenombrando(false);
      setErrorNombre('');
      refrescar();
    } catch (err: any) {
      setErrorNombre(err.message);
    }
  };

  const reportar = async (motivo: string) => {
    if (!reportando?.traduccion) return;
    try {
      await api.reportar(reportando.traduccion.id, motivo);
      const destinoId = reportando.traduccion.id;
      setMensajes((ms) => ms.map((m) => (m.traduccion?.id === destinoId ? { ...m, traduccion: { ...m.traduccion!, reportado: true } } : m)));
      setReportando(null);
      setErrorReporte('');
      setAviso('Gracias por tu reporte. Nos ayuda a mejorar las traducciones.');
    } catch (err: any) {
      setErrorReporte(err.message);
    }
  };

  const config = conv?.configuracion;

  return (
    <View className="flex-1 bg-light-primary dark:bg-dark-primary">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Header
          title=""
          leftComponent={[
            <DrawerButton key="menu" />,
            <View key="titulo" className="ml-4">
              <ThemedText className="text-lg font-outfit-bold" numberOfLines={1}>{conv ? conv.nombre : 'Conversacion'}</ThemedText>
              {config ? <ThemedText className="text-xs opacity-60" numberOfLines={1}>{etiquetaConfig(config)}</ThemedText> : null}
            </View>,
          ]}
          rightComponents={conv ? [
            <Icon key="modo" name={modo === 'burbuja' ? 'MessageSquare' : 'AudioLines'} size={20} onPress={cambiarModo} className="mr-4" />,
            <Icon key="renombrar" name="Pencil" size={20} onPress={() => setRenombrando(true)} />,
          ] : []}
        />
        {cargando ? (
          <View className="flex-1 items-center justify-center"><ActivityIndicator /></View>
        ) : modo === 'burbuja' && conv ? (
          <BurbujaVoz
            estado={grabador.grabando ? 'escuchando' : estadoVoz}
            nivelDb={grabador.nivelDb}
            remitente={remitente}
            alCambiarRemitente={setRemitente}
            alPulsar={pulsarMicrofono}
            ultimo={ultimo}
            idiomaUsuario={conv.configuracion.origen?.idioma}
            idiomaOtro={conv.configuracion.destino.idioma}
          />
        ) : (
          <ScrollView ref={lista} className="flex-1 px-global" contentContainerStyle={{ paddingTop: 12, paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
            {mensajes.length === 0 && conv ? (
              <View className="items-center mt-16 px-6">
                <Icon name="Languages" size={44} color="#0EA5E9" />
                <ThemedText className="text-lg font-outfit-bold mt-4 text-center">Di o escribe tu primer mensaje</ThemedText>
                <ThemedText className="text-center opacity-60 mt-2">Reconocemos tu idioma desde ese mensaje y lo traducimos a {conv.configuracion.destino.idioma} conservando el tono y los modismos.</ThemedText>
              </View>
            ) : null}
            {mensajes.map((m) => (
              <MessageBubble key={m.id} mensaje={m} onHablar={(x) => conv && reproducir(x, conv.configuracion)} onReportar={(x) => { setErrorReporte(''); setReportando(x); }} />
            ))}
            {enviando ? <ThemedText className="opacity-60 text-sm mb-4">Traduciendo...</ThemedText> : null}
          </ScrollView>
        )}
        {aviso ? <ThemedText className="px-global pb-2 text-sm text-highlight" onPress={() => setAviso(null)}>{aviso}</ThemedText> : null}
        {conv && modo === 'chat' ? (
          <TranslatorInput enviando={enviando} remitente={remitente} alCambiarRemitente={setRemitente} grabando={grabador.grabando} alPulsarMicrofono={pulsarMicrofono} alEnviar={enviar} />
        ) : null}
      </KeyboardAvoidingView>

      <PromptModal
        visible={renombrando}
        titulo="Renombrar conversacion"
        valorInicial={conv?.nombre}
        placeholder="Nombre de la conversacion"
        confirmar="Guardar"
        error={errorNombre}
        onConfirm={renombrar}
        onCancel={() => { setRenombrando(false); setErrorNombre(''); }}
      />
      <PromptModal
        visible={!!reportando}
        titulo="Reportar mala traduccion"
        mensaje="Cuentanos que estuvo mal para que podamos mejorar."
        placeholder="Ej: suena muy formal, el modismo no era ese..."
        multilinea
        confirmar="Enviar reporte"
        error={errorReporte}
        onConfirm={reportar}
        onCancel={() => { setReportando(null); setErrorReporte(''); }}
      />
    </View>
  );
}
