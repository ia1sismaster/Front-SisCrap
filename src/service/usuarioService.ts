import { api } from "./api";
import type { LoginRequest, UsuarioResponse, RegistroRequest } from "../types/auth"; // ou defina aqui mesmo

export async function login(email: string, senha: string): Promise<UsuarioResponse> {
    try {
        // 1. Montamos o objeto JSON (Nada de FormData!)
        const payload: LoginRequest = {
            email: email,
            senha: senha
        };

        // 2. Chamada POST
        // Ajuste a URL para bater EXATAMENTE com seu Controller (/api/usuario/login)
        const response = await api.post<UsuarioResponse>("/usuario/login", payload);

        // 3. Salvando o Token (O Passo mais importante)
        if (response.data.token) {
            localStorage.setItem("token", response.data.token);
            // Opcional: Salvar ID do usuário se precisar usar depois
            localStorage.setItem("usuarioId", response.data.usuarioId.toString());
            localStorage.setItem("user_email",response.data.email);
            localStorage.setItem("user_nome",response.data.nome);
        }

        return response.data;

    } catch (error) {
        // Log para debug
        console.error("Erro ao logar:", error);
        // Repassa o erro para a tela (Login.tsx) poder mostrar o aviso vermelho
        throw error;
    }
}

export async function registrar(nome: string, email: string, senha: string): Promise<UsuarioResponse>{

    try {
        
        const payload: RegistroRequest = {
            nome: nome,
            email: email,
            senha: senha
        }
     const response = await api.post<UsuarioResponse>("/usuario/cadastro", payload);
        console.log("ERRO -> ",response)

        // 3. Salvando o Token (O Passo mais importante)
        if (response.data.token) {
            localStorage.setItem("token", response.data.token);
            // Opcional: Salvar ID do usuário se precisar usar depois
            localStorage.setItem("usuarioId", response.data.usuarioId.toString());
            localStorage.setItem("user_email",response.data.email);
            localStorage.setItem("user_nome",response.data.nome);
        }

        return response.data;

    } catch (error) {
        // Log para debug
        console.error("Erro ao logar:", error);
        // Repassa o erro para a tela (Login.tsx) poder mostrar o aviso vermelho
        throw error;
    }

}

// Função utilitária para deslogar
export function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioId");
    localStorage.removeItem("user_nome");
    localStorage.removeItem("user_nome");
    window.location.href = "/login";
}

// Função para checar se está logado (útil para proteger rotas)
export function isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
}