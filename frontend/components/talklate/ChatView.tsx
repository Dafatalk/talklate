import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import Header from '@/components/Header';
import DrawerButton from '@/components/DrawerButton';
import ThemedText from '@/components/ThemedText';
import Icon from '@/components/Icon';
import { api, Configuracion, Mensaje, ResumenConversacion } from '@/lib/api';
import { hablar, localeDe } from '@/lib/voz';
import { useConversaciones } from '@/app/contexts/ConversacionesContext';
import MessageBubble from './MessageBubble';
import TranslatorInput, { EnvioMensaje } from './TranslatorInput';
import PromptModal from './PromptModal';

const etiquetaConfig = (c: Configuracion) =>
  `${c.origen ? c.origen.idioma : 'Idioma por detectar'} → ${c.destino.idioma}${c.destino.region ? ` (${c.destino.region})` : ''}`;

// Pantalla del traductor: una conversacion con sus mensajes originales y traducidos
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

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const r = await api.conversacion(id);
      setConv(r.conversacion);
      setMensajes(r.mensajes);
      setAviso(null);
    } catch (e: any) {
      setAviso(e.message);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { setTimeout(() => lista.current?.scrollToEnd({ animated: true }), 50); }, [mensajes.length]);

  // El audio se reproduce en el idioma/pais en que quedo la traduccion
  const reproducir = (m: Mensaje, config: Configuracion) => {
    if (!m.traduccion) return;
    const hacia = m.remitente === 'usuario' ? config.destino : config.origen;
    if (hacia) hablar(m.traduccion.contenido, hacia.codigo, hacia.pais, m.tono);
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
      const r = await api.renombrar(id, nombre);
      setConv(r.conversacion);
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
  const origenLocale = config?.origen ? localeDe(config.origen.codigo, config.origen.pais) : (typeof navigator !== 'undefined' && navigator.language) || 'es-CO';

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
          rightComponents={conv ? [<Icon key="renombrar" name="Pencil" size={20} onPress={() => setRenombrando(true)} />] : []}
        />
        {cargando ? (
          <View className="flex-1 items-center justify-center"><ActivityIndicator /></View>
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
        {conv ? <TranslatorInput enviando={enviando} localeDictado={origenLocale} alEnviar={enviar} alAvisar={setAviso} /> : null}
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
