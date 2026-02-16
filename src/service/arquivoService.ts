
import { api } from "./api";


function getUsuarioId(): string {
    const id = localStorage.getItem("usuarioId");
    if (!id) {
        // Se não tiver ID (usuário limpou cache ou erro de login), 
        // lança erro ou retorna string vazia para o backend tratar
        console.error("Usuário não identificado no localStorage");
        return "";
    }
    return id;
}

export async function uploadFile(
    arquivo: File, config: {
        colunaProduto: string; colunaFim: string; colunaPreco: string;
        colunaQtd: string; colunaCondicao: string; colunaCodPallet: string;
        colunaCategoria: string;
        linhaInicio: number; percentualCusto: number; percentualLucro: number
    }

) {
    const usuarioId = getUsuarioId();

    const formData = new FormData();
    formData.append("file", arquivo);
    formData.append("usuarioId", usuarioId);
    formData.append("colNome", config.colunaProduto);
    formData.append("colPreco", config.colunaPreco);
    formData.append("colFim", config.colunaFim);
    formData.append("colCondicao", config.colunaCondicao);
    formData.append("colCodPallet", config.colunaCodPallet);
    if (config.colunaCategoria && config.colunaCategoria.trim() !== "") {
        formData.append("colCategoria", config.colunaCategoria.trim());
    }
    if (config.colunaQtd && config.colunaQtd.trim() !== "") {
        formData.append("colQtd", config.colunaQtd.trim());
    }
    formData.append("linhaInicio", String(config.linhaInicio));
    formData.append("percentualCusto", String(config.percentualCusto));
    formData.append("percentualLucro", String(config.percentualLucro));
    console.log("ARQUIVO: ", arquivo)
    try {
        const response = await api.post("/arquivo/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            timeout: 0,
        });

        return response.data;

    } catch (error) {
        console.error("Erro ao efetuar o upload: ", error);
        throw error;
    }


}

export async function listarArquivos() {

    try {
        const usuarioId = getUsuarioId();
        const response = await api.get("/arquivo/listar", {
            params: {
                usuarioId: usuarioId
            }
        });
        return response.data;

    } catch (error) {

        console.error("Erro ao listar os arquivos: ", error);
        throw error;
    }

}

export async function downloadResultado(arquivoId: string) {

    const usuarioId = getUsuarioId();
    const response = await api.get("/arquivo/download", {
        params: { idArquivo: arquivoId, idUsuario: usuarioId },
        responseType: "blob",
        timeout: 0,
    });

    return response;
}

export async function downloadResultadoPallet(arquivoId: string, pallets: string[]) {

    const usuarioId = getUsuarioId();
    const params = new URLSearchParams();
    params.append("idArquivo", arquivoId);
    params.append("idUsuario", String(usuarioId));
    pallets.forEach(p => params.append("pallets", p));

    const response = await api.get("/arquivo/download-pallet", {
        params,
        responseType: "blob",
        timeout: 0,
    });

    return response;
}

interface ExportacaoRequest {
    idUsuario: number;
    idArquivo: number;
    pallets: string[];
}

export async function downloadResultadoPadraoSismaster(arquivoId: string, pallets: string[] = []) {
    const usuarioId = getUsuarioId(); // Sua função que pega do localStorage

   const payload: ExportacaoRequest = {
        idUsuario: Number(usuarioId),
        idArquivo: Number(arquivoId),
        pallets: pallets // Envia o array direto (mesmo vazio)
    };
    try {
        const response = await api.post("/arquivo/download/padrao-sismaster", payload, {
            responseType: "blob", // Importante para baixar arquivo
            timeout: 0,           // Importante para arquivos grandes
        });

        return response;
    } catch (error) {
        console.error("Erro no download Sismaster:", error);
        throw error;
    }
}

export async function listarPallets(arquivoId: string) {

    try {
        const response = await api.get("/arquivo/listar-pallets", {
            params: {
                idArquivo: arquivoId
            },
            timeout: 0,  
        });
        return response.data;

    } catch (error) {

        console.error("Erro ao listar os arquivos: ", error);
        throw error;
    }

}



export async function deletarArquivo(arquivoId: string) {

    try {


        const response = await api.delete("/arquivo", {
            params: { idArquivo: arquivoId }
        });

        return response;

    } catch (error) {
        console.log("erro ao deletar Arquivo" + error);
        throw error;
    }

}


