# Criterios de aceptacion - TalkLate

Cada criterio se puede comprobar en la app o en las pruebas de `backend/test`. Estan tambien en la hoja Entregables del Excel `Mapa de Impacto.xlsx`.

## Traduccion de mensajes

### HU0001 Ingresar mi mensaje hablando
1. Dado que estoy en una conversacion en modo voz, cuando dicto mi mensaje (microfono del navegador o del teclado), entonces el texto aparece y se envia por el canal de voz.
2. Cuando el microfono no esta permitido o el dispositivo no puede dictar, entonces veo un aviso claro y puedo escribir el mensaje.

### HU0002 Ingresar mi mensaje escribiendo
1. Dado que estoy en una conversacion, cuando escribo un mensaje y lo envio, entonces aparecen mi mensaje original y su traduccion.
2. No se puede enviar un mensaje vacio ni de mas de 5000 caracteres.

### HU0003 Traducir mi mensaje al idioma destino en tiempo real
1. Dado un mensaje con un modismo (ej. 'Hay que ponerse las pilas con el trabajo'), cuando lo envio, entonces la traduccion usa el equivalente cultural en la region destino ('We need to get cracking on the work') y no una version literal.
2. Cuando se adapto un modismo, entonces puedo ver una nota cultural que lo explica; si quedaron palabras sin traducir, la traduccion se marca como aproximada.
3. Cuando el servicio no puede traducir, entonces veo un mensaje de error en vez de un resultado vacio.

### HU0004 Escuchar el mensaje traducido
1. Dado un mensaje traducido, cuando toco 'Escuchar', entonces se reproduce con la voz del idioma y pais destino.
2. La velocidad y el tono de la voz cambian segun la entonacion detectada (por ejemplo, alegre o preocupado).

### HU0005 Recibir la traduccion por el mismo canal que use
1. Dado que envie el mensaje por voz, entonces la traduccion se reproduce sola y tambien queda escrita.
2. Dado que envie el mensaje por texto, entonces la traduccion solo se muestra escrita.

## Gestion de conversaciones

### HU0006 Seleccionar el idioma y la region destino
1. Dado que creo una conversacion, cuando elijo un idioma de destino, entonces solo veo las regiones validas para ese idioma.
2. No puedo empezar la conversacion si falta el idioma o la region destino.

### HU0007 Reconocer el idioma origen
1. Dado que no elegi mi idioma, cuando envio mi primer mensaje, entonces el sistema lo reconoce y lo muestra en el encabezado de la conversacion.
2. Una vez reconocido, el idioma de origen no cambia en esa conversacion.
3. Cuando el mensaje es muy corto para reconocer el idioma, entonces se me pide escribir un poco mas.

### HU0008 Crear una conversacion
1. Cuando creo una conversacion sin nombre, entonces se llama 'Nueva Conversacion'.
2. La conversacion creada aparece en el menu lateral y en el historial.

### HU0009 Configurar los parametros una sola vez
1. Dado que ya elegi idioma y region destino al crear la conversacion, entonces los mensajes siguientes no me piden configurar nada.
2. El destino de la conversacion se mantiene mientras la uso.

### HU0010 Mantener el hilo continuo
1. Cuando envio varios mensajes seguidos, entonces cada uno se traduce y queda en el mismo hilo, en orden.
2. Cuando reabro la conversacion mas tarde, entonces veo todos los mensajes anteriores.

### HU0011 Consultar mi historial
1. Cuando abro el historial, entonces veo mis conversaciones con su nombre, idiomas, numero de mensajes y ultimo mensaje, las mas recientes primero.
2. Puedo buscar una conversacion por su nombre.
3. Solo veo mis propias conversaciones.

### HU0012 Abrir una conversacion anterior
1. Cuando toco una conversacion del historial, entonces veo sus mensajes originales y traducidos en orden.
2. No puedo abrir la conversacion de otra persona.

### HU0013 Renombrar una conversacion
1. Cuando cambio el nombre, entonces debe tener entre 3 y 80 caracteres, sin caracteres especiales ni palabras ofensivas; si no, veo el motivo.
2. El nombre nuevo se ve en el encabezado, el menu y el historial.

### HU0014 Eliminar una conversacion
1. Cuando elijo eliminar, entonces la app me pide confirmar y me avisa que no se puede deshacer.
2. Al confirmar, la conversacion se borra con sus mensajes y reportes.

## Cuenta de usuario

### HU0015 Registrarme en la aplicacion
1. Cuando me registro con datos validos, entonces la cuenta se crea y entro a la app.
2. La contrasena debe tener 8 o mas caracteres, una mayuscula, un numero y un simbolo; el correo debe tener formato valido.
3. Debo tener 13 anos o mas; si no, veo 'debes tener al menos 13 anos'.
4. Si el correo ya esta registrado, veo un aviso para iniciar sesion.

### HU0016 Iniciar sesion
1. Con correo y contrasena correctos entro a la app; con datos incorrectos veo 'Usuario o contrasena incorrectos'.
2. Despues de varios intentos fallidos seguidos, el acceso se bloquea unos minutos.
3. Al cerrar y abrir la app sigo con la sesion iniciada.

### HU0017 Recuperar mi contrasena
1. Cuando pido recuperar la contrasena con un correo registrado, entonces recibo un codigo de 6 digitos que vence en 15 minutos.
2. Con un codigo correcto y una contrasena nueva que cumpla las reglas, la contrasena cambia; el codigo solo sirve una vez.
3. Con un codigo incorrecto o vencido veo que debo pedir uno nuevo.
4. Si el correo no esta registrado, veo que no hay una cuenta asociada.

### HU0018 Cerrar sesion
1. Cuando cierro sesion, entonces vuelvo a la pantalla de bienvenida.
2. El acceso anterior deja de funcionar aunque alguien lo conserve.

## Participacion del interlocutor

### HU0019 Recibir el mensaje traducido
1. Dado que la otra persona responde (se escribe como 'Otra persona'), entonces su mensaje se traduce a mi idioma y se muestra a la izquierda, junto a su original.
2. La otra persona no necesita instalar la app ni tener cuenta.

### HU0020 Responder en mi idioma
1. Cuando la otra persona escribe en su propio idioma, entonces su respuesta se traduce al idioma de la conversacion.
2. Para responder ya debe haberse reconocido mi idioma con mi primer mensaje.

## Reportes

### HU0021 Reportar una mala traduccion
1. Cuando reporto una traduccion con un motivo de 3 a 500 caracteres, entonces el reporte se guarda y el mensaje queda marcado como 'Reportado'.
2. Solo puedo reportar una vez la misma traduccion y solo las de mis conversaciones.

### HU0022 Revisar los reportes de mala traduccion
1. Dado que soy administrador, cuando abro los reportes, entonces veo el original, la traduccion, el motivo y la sugerencia, y puedo filtrar por abiertos, revisados o descartados.
2. Puedo marcar un reporte como revisado o descartado.
3. Un cliente que no es administrador no puede ver ni cambiar reportes.

## Administracion de idiomas y regiones

### HU0023 Consultar los idiomas disponibles
1. Cuando abro la configuracion de una conversacion, entonces veo solo los idiomas activos con sus regiones.
2. Los idiomas desactivados no aparecen en la lista.

### HU0024 Agregar un idioma o una region
1. Dado que soy administrador, cuando agrego un idioma, entonces necesita un nombre unico y un codigo de 2 a 5 letras, y queda desactivado hasta que lo active.
2. Una region no puede repetirse dentro del mismo pais; si el pais no existe, debo indicar su codigo de 2 letras.
3. Un cliente que no es administrador no puede agregar idiomas ni regiones.

### HU0025 Activar o desactivar un idioma o una region
1. Cuando activo un idioma, entonces aparece en el catalogo para crear conversaciones; cuando lo desactivo, deja de aparecer.
2. Las conversaciones ya creadas no se ven afectadas.
