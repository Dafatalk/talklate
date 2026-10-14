import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/app/contexts/AuthContext';
import ChatView from '@/components/talklate/ChatView';
import NuevaConversacion from '@/components/talklate/NuevaConversacion';

// Inicio: sin id muestra el formulario de una conversacion nueva; con id abre esa conversacion
export default function Inicio() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { usuario } = useAuth();
  if (!usuario) return null; // el AuthGate esta llevando a la pantalla de bienvenida
  return id ? <ChatView key={id} id={String(id)} /> : <NuevaConversacion />;
}
