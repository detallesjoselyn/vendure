// Maneja estos casos
(() => {
  const NEXT_PHOTO_SELECTOR = "[aria-label='Foto siguiente']";
  const MORE_COMMENTS_SELECTOR = ".j83agx80.buofh1pr.jklb3kyz .oajrlxb2";
  const PHOTO_HEADER_SELECTOR = ".a8nywdso.j7796vcc span";
  const COMMENT_WRAPPERS_SELECTOR = ".tw6a2znq.sj5x9vvc.d1544ag0.cxgpxx05";
  const COMMENT_CONTENT_SELECTOR = ".kvgmc6g5.cxmmr5t8";
  const permiteDescargarCSVvacios = false;
  const prefijoCantidad = 'DP';

  const docReady = (fn, intento = 1) => {
    setTimeout(() => {
      if (document.querySelector(PHOTO_HEADER_SELECTOR) !== null) {
        return fn();
      } else if (intento % 10 == 0) {
        if (confirm("Continuar?")) {
          return docReady(fn, intento + 1);
        } else {
          return console.log("Programa Terminado");
        }
      } else {
        console.log("Abriendo pagina");
        return docReady(fn, intento + 1);
      }
    }, 1000);
  };

  const casos = [
    "    Fedex    1 ",
    "Fedex    1",
    "Fedex 1",
    "Fedex",
    "Fedex1",
    "Fedex19",
    "10Fedex",
    "10     Fedex",
    "15Fedex",
    "1Fedex",
    "1 Fedex",
    "Apartado 2 mts",
    "A 1 metro",
    "Apartado 2 mts",
    "Paso Local 1", //-> Por hacer
    "Apar tado 1", //-> Por hacer mismo que anterior
    "Dos fedex", // No manejado
  ];

  const esValido = (cantidad, metodo) => {
    const cantidadEsNumero = !isNaN(parseInt(cantidad));
    const metodoEsString =
      isNaN(parseInt(metodo)) && typeof metodo === "string";
    return cantidadEsNumero && metodoEsString;
  };

  const generateCSV = (csvContent, codigo, numeroComentariosInvalidos) => {
    const csvConfig = "data:text/csv;charset=utf-8,";
    const encodedUri = encodeURI(csvConfig + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const revisarPrefix =
      numeroComentariosInvalidos > 0
        ? "REVISAR--" + numeroComentariosInvalidos + "-REGISTROS"
        : "";
    link.setAttribute(
      "download",
      revisarPrefix + codigo + "_DetallesJocelyn.csv"
    );
    document.body.appendChild(link); // Required for FF
    link.click();
  };

  const procesarComment = (comment) => {
    // Removiendo espacios
    // Resuelve "    Fedex    1 ", "Fedex    1"
    const contentComment = comment.trim().replace(/\s+/g, " ");

    // Obteniendo array de elementos
    let [metodo, cantidad, ...otros] = contentComment.split(" ");

    // validando Happy path

    if (esValido(cantidad, metodo))
      return { cantidad, metodo, comentarioValido: true };

    // si metodo y cantidad es string
    // si cantidad y metodo es
    const cantidadEsString = isNaN(parseInt(cantidad));
    const metodoEsNumero = !isNaN(parseInt(metodo));
    const cantidadEstaDefinido = cantidad !== "" && cantidad !== undefined;

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
      cantidad = !!tieneNumero ? tieneNumero[0] : "1";

      const tieneLetras = metodo.match(/[a-z]+/i);
      metodo = !!tieneLetras ? tieneLetras[0] : "Error: Sin paqueteria";

      if (esValido(cantidad, metodo))
        return { cantidad, metodo, comentarioValido: true };
    }

    return { cantidad, metodo, comentarioValido: false };
  };
  // codigo para validar casos
  //   console.log(casos.map(caso=>({...obtenerCantidadYMetodo(caso), caso})).filter(({comentarioValido})=>!comentarioValido));

  const procesarFoto = (onFinish) => {
    const descargarMensajes = (onFinish) => {
      // se obtiene codigo y precio del producto
      let [codigo, , precio, venta, cantidadDisponible=0] = document
        .querySelector(PHOTO_HEADER_SELECTOR)?.innerHTML.split("<br>") || [];

      // se obtienen comentarios del productos
      const commentWrappers = Array.from(
        document.querySelectorAll(COMMENT_WRAPPERS_SELECTOR)
      );

      const dataToSave = Array.from(commentWrappers).map((element) => {
        const [titulo, comment] = Array.from(
          element.querySelectorAll(COMMENT_CONTENT_SELECTOR)
        );

        const contentComment = comment.querySelector("div").innerHTML;
        const { metodo, cantidad, comentarioValido } = procesarComment(
          contentComment
        );

        comentario = !comentarioValido ? contentComment+', Ir:' + document.location.href : ','

        return {
          line:
            `${titulo.text}
            ,${metodo.toLowerCase()}
            ,${cantidad}
            ,${codigo}
            ,${precio}
            ,${parseFloat(precio.replace("$", "")) * parseInt(cantidad)}
            ,${venta}
            ,${comentario}
            ,${cantidadDisponible}`,
          comentarioValido,
        };
      });
      const numeroComentariosInvalidos = dataToSave.filter(
        ({ comentarioValido }) => !comentarioValido
      ).length;
      const csvContent = dataToSave.map(({ line }) => line).join("\r\n");

      if (dataToSave.length > 0 || permiteDescargarCSVvacios) {
        generateCSV(csvContent, codigo, numeroComentariosInvalidos);
        console.log(
          "Codigo:",
          codigo,
          ', descargados: ',
          dataToSave.length,
          ', invalidos: ',
          numeroComentariosInvalidos,
          numeroComentariosInvalidos > 0 ? ', Ir:' + document.location.href : ''
        );
      } else {
        console.log(
          "Codigo:",
          codigo,
          ", 0 registros, URL:",
          document.location.href
        );
      }

      onFinish();
    };

    const esperarHastaDesaparecerCommentarios = () => {
      let id;

      const frame = () => {
        const moreCommentsbutton = document.querySelector(MORE_COMMENTS_SELECTOR);
        if (moreCommentsbutton === null) {
          clearInterval(id);
          descargarMensajes(onFinish);
        }
        else {
          moreCommentsbutton.click();
          console.log("Abriendo comments");
        }
      };
      id = setInterval(frame, 1000);
    };

    esperarHastaDesaparecerCommentarios();
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

  docReady(() => {
    if (confirm("Empezar?")) {
      procesarFoto(descargarTodos);
    }
  });
})();
