import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/app/contexts/AuthContext';
import ChatView from '@/components/talklate/ChatView';
import NuevaConversacion from '@/components/talklate/NuevaConversacion';
import ListaConversaciones from '@/components/talklate/ListaConversaciones';

// Inicio: por defecto muestra el listado de conversaciones (para retomar cualquiera sin crear una nueva).
// Con ?id abre esa conversacion; con ?nueva=1 muestra el formulario de una conversacion nueva.
export default function Inicio() {
  const { id, nueva } = useLocalSearchParams<{ id?: string; nueva?: string }>();
  const { usuario } = useAuth();
  if (!usuario) return null; // el AuthGate esta llevando a la pantalla de bienvenida
  if (id) return <ChatView key={String(id)} id={String(id)} />;
  if (nueva) return <NuevaConversacion />;
  return <ListaConversaciones />;
}
