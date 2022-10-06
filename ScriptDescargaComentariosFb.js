
(() => {
  const findElementByContentText = (elements, text) => {
    for (const div of elements) {
      if (div.textContent.includes(text)) {
        return div;
      }
    }
    console.log(`No se encuentra el texto ${text}`);
    return;
  };
  const NEXT_PHOTO_SELECTOR = "[aria-label='Foto siguiente']";

  const getMoreCommentsElement = () =>
  document?.querySelector(
    '.x78zum5.x1iyjqo2.x21xpn4.x1n2onr6 .x1i10hfl[role="button"] .x193iq5w.xeuugli',
  );

  const getHeaderElement = () =>
    document.querySelector(
      '.x1swvt13 > div > .xkhd6sd > .x193iq5w[dir="auto"]',
    );

  const getCommentWrapperElements = () =>
    document.querySelectorAll('.x1jx94hy ul')[0];

  const getContentElement = (element) => element.querySelector('.x1n2onr6 .x1n2onr6.x4uap5.x18d9i69.x1swvt13.x1iorvi4.x78zum5.x1q0g3np.x1a2a7pz');

  const getMenuElement =()=> document?.querySelector(
    '.xb57i2i.x1q594ok.x5lxg6s.x6ikm8r.x1ja2u2z.x1pq812k.x1rohswg.xfk6m8.x1yqm8si.xjx87ck.xx8ngbg.xwo3gff.x1n2onr6.x1oyok0e.x1odjw0f.x1e4zzel.x1qjc9v5.x9f619.x78zum5.xdt5ytf.x4uap5.xkhd6sd.x1ten1a2.xz7cn9q.x168biu4 > div > div',
    );

  const permiteDescargarCSVvacios = false;
  const prefijoCantidad = 'DP';

  const docReady = (fn, intento = 1) => {
    setTimeout(() => {
      if (getHeaderElement() !== null) {
        return fn();
      } else if (intento % 10 == 0) {
        if (confirm('Continuar?')) {
          return docReady(fn, intento + 1);
        } else {
          return console.log('Programa Terminado');
        }
      } else {
        console.log('Abriendo pagina');
        return docReady(fn, intento + 1);
      }
    }, 1000);
  };

  const casos = [
    '    Fedex    1 ',
    'Fedex    1',
    'Fedex 1',
    'Fedex',
    'Fedex1',
    'Fedex19',
    '10Fedex',
    '10     Fedex',
    '15Fedex',
    '1Fedex',
    '1 Fedex',
    'Apartado 2 mts',
    'A 1 metro',
    'Apartado 2 mts',
    'Paso Local 1', //-> Por hacer
    'Apar tado 1', //-> Por hacer mismo que anterior
    'Dos fedex', // No manejado
  ];

  const esValido = (cantidad, metodo) => {
    const cantidadEsNumero = !isNaN(parseInt(cantidad));
    const metodoEsString =
      isNaN(parseInt(metodo)) && typeof metodo === 'string';
    return cantidadEsNumero && metodoEsString;
  };

  const generateCSV = (csvContent, codigo, numeroComentariosInvalidos) => {
    const csvConfig = 'data:text/csv;charset=utf-8,';
    const encodedUri = encodeURI(csvConfig + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const revisarPrefix =
      numeroComentariosInvalidos > 0
        ? 'REVISAR--' + numeroComentariosInvalidos + '-REGISTROS'
        : '';
    link.setAttribute(
      'download',
      revisarPrefix + codigo + '_DetallesJocelyn.csv',
    );
    document.body.appendChild(link); // Required for FF
    link.click();
  };

  const procesarComment = (comment) => {
    // Removiendo espacios
    // Resuelve "    Fedex    1 ", "Fedex    1"
    const contentComment = comment.trim().replace(/\s+/g, ' ');

    // Obteniendo array de elementos
    let [metodo, cantidad, ...otros] = contentComment.split(' ');

    // validando Happy path

    if (esValido(cantidad, metodo))
      return { cantidad, metodo, comentarioValido: true };

    // si metodo y cantidad es string
    // si cantidad y metodo es
    const cantidadEsString = isNaN(parseInt(cantidad));
    const metodoEsNumero = !isNaN(parseInt(metodo));
    const cantidadEstaDefinido = cantidad !== '' && cantidad !== undefined;

    // cuando los valores vienen invertidos.
    const valoresInvertidos = cantidadEsString && metodoEsNumero;
    if (valoresInvertidos && cantidadEstaDefinido) {
      const metodoAux = metodo;
      metodo = cantidad;
      cantidad = metodoAux;

      if (esValido(cantidad, metodo))
        return { cantidad, metodo, comentarioValido: true };
    }

    if (!cantidadEstaDefinido) {
      // Revisando si los elementos metodo y cantidad vienen juntos
      // el valor viene al final o no tiene valor
      const tieneNumero = metodo.match(/\d+/);
      // separando el numero de las letras
      cantidad = !!tieneNumero ? tieneNumero[0] : '1';

      const tieneLetras = metodo.match(/[a-z]+/i);
      metodo = !!tieneLetras ? tieneLetras[0] : 'Error: Sin paqueteria';

      if (esValido(cantidad, metodo))
        return { cantidad, metodo, comentarioValido: true };
    }

    return { cantidad, metodo, comentarioValido: false };
  };
  // codigo para validar casos
  //   console.log(casos.map(caso=>({...obtenerCantidadYMetodo(caso), caso})).filter(({comentarioValido})=>!comentarioValido));
  const CANTIDAD_DEFAULT = 0;
  const procesarFoto = (onFinish) => {
    const descargarMensajes = (onFinish) => {
      // se obtiene codigo y precio del producto

      let [codigo, , precio, venta, cantidadDisponibleRenglon] =
        getHeaderElement()?.innerHTML.split('<br>') || [];

      // Si no existe un valor valido se setea valor por default
      if (cantidadDisponibleRenglon.indexOf(prefijoCantidad) < 0) {
        cantidadDisponibleRenglon = `${prefijoCantidad}${CANTIDAD_DEFAULT}`;
      }
      // se obtienen comentarios del productos
      const commentWrappers = Array.from(
        getCommentWrapperElements()?.children || [],
      );

      const dataToSave = Array.from(commentWrappers).map((element) => {
        const commentElement = getContentElement(element)
        const [, comment] = Array.from(
          commentElement.children,
        );
        const contentComment = comment.querySelector('span  > div >div ').textContent;;
        const titulo = comment.querySelectorAll('span')[0].textContent;
        
        const { metodo, cantidad, comentarioValido } = contentComment
          ? procesarComment(contentComment)
          : { comentarioValido: false, metodo: '', cantidad: 0 };

        comentario = !comentarioValido
          ? contentComment + ', Ir:' + document.location.href
          : ',';

        let cantidadDisponible = (cantidadDisponibleRenglon.split(
          prefijoCantidad,
        ) || [,])[1];
        cantidadDisponible = Number.isInteger(Number(cantidadDisponible))
          ? cantidadDisponible
          : CANTIDAD_DEFAULT;

        return {
          line:
            titulo +
            ',' +
            metodo.toLowerCase() +
            ',' +
            cantidad +
            ',' +
            codigo +
            ',' +
            precio +
            ',' +
            `${parseFloat(precio.replace('$', '')) * parseInt(cantidad)}` +
            ',' +
            venta +
            ',' +
            comentario +
            ',' +
            cantidadDisponible,
          comentarioValido,
        };
      });
      const numeroComentariosInvalidos = dataToSave.filter(
        ({ comentarioValido }) => !comentarioValido,
      ).length;

      const csvContent = dataToSave.map(({ line }) => line).join('\r\n');

      if (dataToSave.length > 0 || permiteDescargarCSVvacios) {
        generateCSV(csvContent, codigo, numeroComentariosInvalidos);
        console.info(
          'DESCARGANDO COMENTARIOS Codigo:',
          codigo,
          ', descargados: ',
          dataToSave.length,
          ', invalidos: ',
          numeroComentariosInvalidos,
          numeroComentariosInvalidos > 0
            ? ', Ir:' + document.location.href
            : '',
        );
      } else {
        console.warn(
          'NO EXISTEN COMENTARIOS EN ESTE Codigo:',
          codigo,
          ', 0 registros, URL:',
          document.location.href,
        );
      }

      onFinish();
    };

    const esperarHastaDesaparecerCommentarios = () => {
      let id;

      const frame = () => {
        console.log('Revisando commentarios');
        const moreCommentsbutton = getMoreCommentsElement();
        if (moreCommentsbutton === null) {
          clearInterval(id);
          console.log('Descargando Mensajes');
          descargarMensajes(onFinish);
        } else {
          moreCommentsbutton.click();
          console.log('Abriendo comments');
        }
      };
      id = setInterval(frame, 1000);
    };

    const esperarHastaQueHabraElMenu = (onReady) => {
      const posibleMenuElements = document.querySelectorAll(
        '.x193iq5w.xeuugli.x13faqbe.x1vvkbs.xlh3980.xvmahel.x1n0sxbx.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.x4zkp8e.x3x7a5m.x1f6kntn.xvq8zen.x1s688f.xi81zsa',
      );
      const menuCommentsElement =findElementByContentText(posibleMenuElements,'Más recientes')
      const comentariosDestacados =findElementByContentText(posibleMenuElements,'Comentarios destacados')

      let id;
      let intentos = 0;
      if (!menuCommentsElement && !comentariosDestacados) {
        console.log(`No tiene menu de comentarios`);
        clearInterval(id);
        onReady();
        return;
      }
      if(comentariosDestacados){
        comentariosDestacados.click();
      } 
      else{
        menuCommentsElement.click();
      }
      

      const frame = () => {
        const getAllMenuOptions =()=> document.querySelectorAll(
          '.x4k7w5x.x1h91t0o.x1beo9mf.xaigb6o.x12ejxvf.x3igimt.xarpa2k.xedcshv [role="menuitem"]',
        )
        const menuOptions = Array.from(
          getAllMenuOptions(),
        );
        const todosLosComentarios = 'Todos los comentarios';
        const todosLosComentariosOption =findElementByContentText(menuOptions,'Todos los comentarios')

        if (todosLosComentariosOption) {
          console.log('Mostrando todos los comentarios...');
          todosLosComentariosOption.click();
          clearInterval(id);
          onReady();
          return;
        } else if (intentos === 3) {
          console.log(`No se encontro boton de ${todosLosComentarios}`);
          clearInterval(id);
          onReady();
          return;
        } else {
          intentos++;
          console.log('Cargando menu');
        }
      };
      id = setInterval(frame, 800);
    };

    esperarHastaQueHabraElMenu(() => {
      esperarHastaDesaparecerCommentarios();
    });
  };

  const descargarTodos = () => {
    const nextPhotoButton = document.querySelector(NEXT_PHOTO_SELECTOR);
    if (nextPhotoButton !== null) {
      nextPhotoButton?.click();
      docReady(() => {
        procesarFoto(descargarTodos);
      });
    }
  };

  const cerrarTodos = () => {
    console.log('Next Page');
    const nextPhotoButton = document.querySelector(NEXT_PHOTO_SELECTOR);
    if (nextPhotoButton !== null) {
      nextPhotoButton?.click();
      docReady(() => {
        cerrarComentariosFn(cerrarTodos);
      });
    }
  };

  const cerrarComentariosFn = (onFinish) => {
    const esperarHastaQueHabraElMenu = (onReady) => {
      const PHOTO_ACTION_SELECTOR =
        'div[aria-label="Acciones para esta publicación"]';
      const menuPhotoElement = document.querySelector(PHOTO_ACTION_SELECTOR);
      let id;
      let intentos = 0;
      menuPhotoElement.click();
      const frame = () => {
        const menuOptions = getMenuElement()?.children || [];
        const desactivarOption = [...menuOptions].find((option) =>
          option.textContent.includes('Desactivar comentarios'),
        );

        if (desactivarOption) {
          console.log('Cerrando comentarios...');
          desactivarOption.click();
          clearInterval(id);
          onReady();
          return;
        } else if (intentos === 3) {
          console.log('No se encontro boton de cerrar');
          clearInterval(id);
          onReady();
          return;
        } else {
          intentos++;
          console.log('Cargando menu');
        }
      };
      id = setInterval(frame, 800);
    };
    const esperarHastaQueAparezcaElLabel = () => {
      const nextPhotoButton = document.querySelector(NEXT_PHOTO_SELECTOR);
      let id;
      let intentos = 0;

      const frame = () => {
        const cerrarCommentsElement = document?.querySelector(
          '.x193iq5w.xeuugli.x13faqbe.x1vvkbs.xlh3980.xvmahel.x1n0sxbx.x1lliihq.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.x4zkp8e.x676frb.x1pg5gke.x1sibtaa.x1s688f.xi81zsa.x2b8uid',
        );

        if (cerrarCommentsElement !== null && nextPhotoButton !== null) {
          clearInterval(id);
          console.log('Abriendo siguiente foto');
          onFinish();
          return;
        } else if (intentos === 3) {
          clearInterval(id);
          alert('Terminado');
          return;
        } else {
          intentos++;
          console.log('Looking for label');
        }
      };
      id = setInterval(frame, 800);
    };
    esperarHastaQueHabraElMenu(() => {
      esperarHastaQueAparezcaElLabel();
    });
  };

  docReady(() => {
    if (confirm('Deseas cerrar comentarios?')) {
      // Pagina cargada
      // Click en Menu
      // Espera a que menu este listo
      // Click en cerrar comentarios
      // Espera a que este listo el cartel de cerrado
      cerrarComentariosFn(cerrarTodos);
    } else if (confirm('Deseas descargar comentarios?')) {
      procesarFoto(descargarTodos);
    }
  });
})();
