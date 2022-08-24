(() => {
  const NEXT_PHOTO_SELECTOR = "[aria-label='Foto siguiente']";

  const getMoreCommentsElement = () =>
    document?.querySelector(
      '.k0kqjr44 .alzwoclg .qi72231t[role="button"] .alzwoclg .gvxzyvdx',
    );

  const getHeaderElement = () =>
    document.querySelectorAll(
      "[role='complementary'] .gvxzyvdx.aeinzg81.pbevjfx6",
    )[1];

  const getCommentWrapperElements = () =>
    document.querySelectorAll('.k0kqjr44 ul')[0];

  const getContentElement = (element) =>
    element.querySelector('.jg3vgc78 .e4ay1f3w.r5g9zsuq.aesu6q9g.q46jt4gp');

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
        const [titulo, comment] = Array.from(
          getContentElement(element).children,
        );

        const contentComment =
          comment.querySelector('span > div >div ').textContent;

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
            titulo.textContent +
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
        console.log(
          'Codigo:',
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
        console.log(
          'Codigo:',
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
      const COMMENT_ACTION_SELECTOR =
        '.k0kqjr44 .alzwoclg .qi72231t[role="button"] .gvxzyvdx';
      const menuCommentsElement = document.querySelector(
        COMMENT_ACTION_SELECTOR,
      );

      let id;
      let intentos = 0;
      if (!menuCommentsElement) {
        console.log(`No tiene menu de comentarios`);
        clearInterval(id);
        onReady();
        return;
      }
      menuCommentsElement.click();

      const frame = () => {
        const menuOptions = Array.from(
          document.querySelectorAll(
            '.alzwoclg.cqf1kptm.cgu29s5g.om3e55n1 [role="menuitem"]',
          ),
        );
        const buttonText = 'Todos los comentarios';
        const todosLosComentariosOption = [...menuOptions].find((option) =>
          option.textContent.includes(buttonText),
        );
        if (todosLosComentariosOption) {
          console.log('Mostrando todos los comentarios...');
          todosLosComentariosOption.click();
          clearInterval(id);
          onReady();
          return;
        } else if (intentos === 3) {
          console.log(`No se encontro boton de ${buttonText}`);
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
        const menuOptions = document.querySelectorAll(
          'div.oajrlxb2  div.bp9cbjyn  span.d2edcug0',
        );
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
      const CERRAR_COMMENTS_SELECTOR = 'div.bp9cbjyn > span.d2edcug0.oqcyycmt';
      const nextPhotoButton = document.querySelector(NEXT_PHOTO_SELECTOR);
      let id;
      let intentos = 0;

      const frame = () => {
        const cerrarCommentsLabel = document?.querySelector(
          CERRAR_COMMENTS_SELECTOR,
        );
        if (cerrarCommentsLabel !== null && nextPhotoButton !== null) {
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
