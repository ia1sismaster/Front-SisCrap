import { api } from "./api";
import type { AtualizarPrecoRequest } from "../types/produto";



export interface FiltrosProduto {
    search?: string;
    pallet?: string;
    condicao?: string;
}

export async function listarProdutos(
    idArquivo: number, 
    page: number = 0, 
    filters: FiltrosProduto = {} // Novo parâmetro opcional
) {
    try {
        const response = await api.get("/produto", { 
            params: { 
                arquivoId: idArquivo, // Nome tem que bater com @RequestParam do Java
                page, 
                size: 50,
                
                // Adicionando os filtros novos
                // Se estiver vazio ou undefined, o Axios geralmente ignora ou manda vazio,
                // o que o Spring aceita (required=false)
                search: filters.search || undefined,
                pallet: filters.pallet || undefined,
                condicao: filters.condicao || undefined
            },
            timeout: 0
        });
        
        return response.data; 

    } catch (error) {
        console.error("Erro ao listar produtos:", error);
        throw error;
    }
}

export async function atualizarPreco(lista: AtualizarPrecoRequest[]) {

    try {
        const response = await api.put("/produto/editar",lista)
        return response.data;
    } catch (error) {

        console.log("erro ao editar produto"+error)
        throw error;

        
    }
    
}