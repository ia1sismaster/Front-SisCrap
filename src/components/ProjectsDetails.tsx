import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  ArrowLeft, CheckCircle, Clock, ExternalLink, Search, AlertCircle, RefreshCcw,
  Check, Pencil, Box, Tag, FileCheck, FileX, ShieldAlert, SearchX, Ban,
  ChevronLeft, ChevronRight
} from "lucide-react";
import {
  listarTarefasPorId,
  reprocessarBloqueados,
  aprovarSimilar,
  corrigirSimilar,
  obterResumo,
  escolherCandidato,
  type CorrecaoSimilarDto,
  type FiltrosTarefa,
  type PageResponse
} from "../service/TarefaService";
import { EditSimilarModal } from "../components/EditSimilarModal";
import React from "react";

interface TarefaCandidato {
  id: number;
  titulo: string;
  preco: string;
  precoDesconto: string;
  link: string;
  matchScore: number;
  escolhido: boolean;
}

interface TarefaBackend {
  id: number;
  termo_busca: string;
  titulo_encontrado: string;
  custoUnitario: string;
  condicao: string;
  codPallet: string;
  preco: string;
  preco_desc: string;
  link: string;
  score: number;
  status: "NAO_ENCONTRADO" | "SUCESSO" | "BLOQUEADO" | "SIMILAR";
  statusRevisao: "APROVADO" | "NA" | "REPROVADO";
  candidatos?: TarefaCandidato[];
}

interface TarefasResumo {
  total: number;
  sucesso: number;
  similar: number;
  bloqueado: number;
  naoEncontrado: number;
  aprovados: number;
  reprovados: number;
  pendentesRevisao: number;
}

export function ProjectsDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pageData, setPageData] = useState<PageResponse<TarefaBackend>>({
    content: [],
    totalPages: 0,
    totalElements: 0,
    size: 50,
    number: 0
  });
  const [resumo, setResumo] = useState<TarefasResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReprocessing, setIsReprocessing] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [palletFilter, setPalletFilter] = useState<string>("");
  const [condicaoFilter, setCondicaoFilter] = useState<string>("");
  const [revisaoFilter, setRevisaoFilter] = useState<string>("TODOS");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TarefaBackend | null>(null);

  const carregarResumo = useCallback(async () => {
    if (!id) return;
    try {
      const dados = await obterResumo(id);
      setResumo(dados);
    } catch (error) {
      console.error("Erro ao carregar resumo:", error);
    }
  }, [id]);

  const carregarTarefas = useCallback(async (page: number = 0, isSilent = false) => {
    if (!id) return;
    if (!isSilent) setLoading(true);
    try {
      const filtros: FiltrosTarefa = {
        search: searchTerm || undefined,
        pallet: palletFilter || undefined,
        condicao: condicaoFilter || undefined,
        status: statusFilter || undefined,
        statusRevisao: revisaoFilter !== "TODOS" ? revisaoFilter : undefined
      };
      const dados = await listarTarefasPorId(id, page, filtros);
      setPageData(dados);
      setCurrentPage(page);
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [id, searchTerm, statusFilter, palletFilter, condicaoFilter, revisaoFilter]);

  useEffect(() => { carregarResumo(); }, [carregarResumo]);
  useEffect(() => { carregarTarefas(currentPage); }, [carregarTarefas, currentPage]);
  useEffect(() => {
    if (currentPage !== 0) setCurrentPage(0);
  }, [searchTerm, statusFilter, palletFilter, condicaoFilter, revisaoFilter]);

  async function handleReprocessar() {
    if (!id) return;
    setIsReprocessing(true);
    try {
      await reprocessarBloqueados(id);
      await carregarResumo();
      await carregarTarefas(currentPage, true);
      if (statusFilter === "BLOQUEADO") setStatusFilter(null);
    } catch (error) {
      alert("Não foi possível iniciar o reprocessamento.");
    } finally {
      setIsReprocessing(false);
    }
  }

  async function handleAprovar(task: TarefaBackend) {
    const originalContent = [...pageData.content];
    setPageData(prev => ({
      ...prev,
      content: prev.content.map(t => t.id === task.id ? { ...t, statusRevisao: "APROVADO" as const, candidatos: undefined } : t)
    }));
    try {
      await aprovarSimilar(task.id);
      await carregarResumo();
    } catch (error) {
      alert("Erro ao aprovar item.");
      setPageData(prev => ({ ...prev, content: originalContent }));
    }
  }

  // 🆕 Escolher candidato
  async function handleEscolherCandidato(tarefaId: number, candidatoId: number) {
    // Atualização otimista na tela
    setPageData(prev => ({
      ...prev,
      content: prev.content.map(tarefa => {
        if (tarefa.id !== tarefaId || !tarefa.candidatos) return tarefa;

        const candidatoEscolhido = tarefa.candidatos.find(c => c.id === candidatoId);
        if (!candidatoEscolhido) return tarefa;

        return {
          ...tarefa,
          titulo_encontrado: candidatoEscolhido.titulo,
          preco: candidatoEscolhido.preco,
          preco_desc: candidatoEscolhido.precoDesconto,
          link: candidatoEscolhido.link,
          score: candidatoEscolhido.matchScore,
          candidatos: tarefa.candidatos.map(c => ({
            ...c,
            escolhido: c.id === candidatoId
          }))
        };
      })
    }));

    try {
      await escolherCandidato(tarefaId, candidatoId);
    } catch (error) {
      alert("Erro ao escolher candidato.");
      await carregarTarefas(currentPage, true);
    }
  }

  function openEditModal(task: TarefaBackend) {
    setEditingTask(task);
    setIsModalOpen(true);
  }

  async function handleSalvarCorrecao(dto: CorrecaoSimilarDto) {
    await corrigirSimilar(dto);
    await aprovarSimilar(dto.tarefaId);
    setPageData(prev => ({
      ...prev,
      content: prev.content.map(t => {
        if (t.id !== dto.tarefaId) return t;
        return {
          ...t,
          statusRevisao: "APROVADO" as const,
          titulo_encontrado: dto.titulo,
          preco: dto.preco,
          preco_desc: dto.precoDesc,
          link: dto.link,
          status: t.status === "NAO_ENCONTRADO" ? "SUCESSO" as const : t.status,
          candidatos: undefined
        };
      })
    }));
    await carregarResumo();
  }

  function toggleStatusFilter(status: string) {
    setRevisaoFilter("TODOS");
    setStatusFilter(prev => (prev === status ? null : status));
  }

  const formatCurrency = (val: string | number) => {
    if (!val) return "-";
    return `R$ ${val}`;
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase() || "PENDENTE";
    switch (s) {
      case "SUCESSO": return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200"><CheckCircle className="w-3.5 h-3.5" /> Sucesso</span>;
      case "SIMILAR": return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200"><ShieldAlert className="w-3.5 h-3.5" /> Similar</span>;
      case "NAO_ENCONTRADO": return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200"><SearchX className="w-3.5 h-3.5" /> Não Achou</span>;
      case "BLOQUEADO": return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200"><Ban className="w-3.5 h-3.5" /> Bloqueado</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"><Clock className="w-3.5 h-3.5" /> Pendente</span>;
    }
  };

  const getRevisaoBadge = (revisao: string) => {
    switch (revisao) {
      case "APROVADO": return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-200"><FileCheck className="w-3 h-3" /> Verificado</span>;
      case "REPROVADO": return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-200"><FileX className="w-3 h-3" /> Reprovado</span>;
      default: return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">Pendente</span>;
    }
  };

  const uniquePallets = Array.from(new Set(pageData.content.map(t => t.codPallet).filter(Boolean)));
  const uniqueConditions = Array.from(new Set(pageData.content.map(t => t.condicao).filter(Boolean)));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* HEADER */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Detalhes do Projeto</h1>
              <p className="text-muted-foreground text-sm">Visualizando tarefas do arquivo #{id}</p>
            </div>
          </div>
          {resumo && resumo.bloqueado > 0 && (
            <Button onClick={handleReprocessar} disabled={isReprocessing} variant="outline" className="border-yellow-500 text-yellow-700 hover:bg-yellow-50">
              <RefreshCcw className={`w-4 h-4 mr-2 ${isReprocessing ? 'animate-spin' : ''}`} />
              {isReprocessing ? "Reprocessando..." : `Reprocessar ${resumo.bloqueado} Bloqueados`}
            </Button>
          )}
        </div>

        {/* CARDS DE CONTAGEM */}
        {resumo && (
          <div className="flex gap-4 text-sm flex-wrap">
            <div onClick={() => setStatusFilter(null)} className={`px-4 py-2 border rounded-lg shadow-sm cursor-pointer transition select-none ${statusFilter === null ? "bg-primary/10 border-primary" : "bg-card hover:bg-muted"}`}>
              <span className="text-muted-foreground">Total:</span> <strong>{resumo.total}</strong>
            </div>
            <div onClick={() => toggleStatusFilter("SUCESSO")} className={`px-4 py-2 border rounded-lg shadow-sm cursor-pointer transition select-none ${statusFilter === "SUCESSO" ? "bg-green-100 border-green-400" : "bg-card hover:bg-muted"}`}>
              <span className="text-green-600">Sucesso:</span> <strong>{resumo.sucesso}</strong>
            </div>
            <div onClick={() => toggleStatusFilter("SIMILAR")} className={`px-4 py-2 border rounded-lg shadow-sm cursor-pointer transition select-none ${statusFilter === "SIMILAR" ? "bg-blue-100 border-blue-400" : "bg-card hover:bg-muted"}`}>
              <span className="text-blue-600">Similares:</span> <strong>{resumo.similar}</strong>
            </div>
            <div onClick={() => toggleStatusFilter("BLOQUEADO")} className={`px-4 py-2 border rounded-lg shadow-sm cursor-pointer transition select-none ${statusFilter === "BLOQUEADO" ? "bg-yellow-100 border-yellow-400" : "bg-card hover:bg-muted"}`}>
              <span className="text-yellow-600">Bloqueado:</span> <strong>{resumo.bloqueado}</strong>
            </div>
            <div onClick={() => toggleStatusFilter("NAO_ENCONTRADO")} className={`px-4 py-2 border rounded-lg shadow-sm cursor-pointer transition select-none ${statusFilter === "NAO_ENCONTRADO" ? "bg-red-100 border-red-400" : "bg-card hover:bg-muted"}`}>
              <span className="text-red-600">Não Enc.:</span> <strong>{resumo.naoEncontrado}</strong>
            </div>
          </div>
        )}
      </div>

      {/* TABELA */}
      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">

        {/* FILTROS */}
        <div className="p-4 border-b flex flex-col lg:flex-row gap-4 bg-muted/20 items-end lg:items-center">
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar termo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          {statusFilter === "SIMILAR" && (
            <div className="flex bg-white p-1 rounded-md border border-blue-200 shadow-sm animate-in fade-in slide-in-from-left-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground self-center px-2 mr-1 border-r">Revisão</span>
              <button onClick={() => setRevisaoFilter("TODOS")} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${revisaoFilter === "TODOS" ? "bg-slate-100 text-foreground font-bold" : "text-muted-foreground hover:bg-slate-50"}`}>Todos</button>
              <button onClick={() => setRevisaoFilter("APROVADO")} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${revisaoFilter === "APROVADO" ? "bg-green-50 text-green-700 font-bold border border-green-200" : "text-muted-foreground hover:bg-slate-50"}`}>Aprovados</button>
              <button onClick={() => setRevisaoFilter("REPROVADO")} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${revisaoFilter === "REPROVADO" ? "bg-red-50 text-red-700 font-bold border border-red-200" : "text-muted-foreground hover:bg-slate-50"}`}>Reprovados</button>
            </div>
          )}

          {uniquePallets.length > 0 && (
            <select className="w-32 h-9 rounded-md border text-sm" value={palletFilter} onChange={(e) => setPalletFilter(e.target.value)}>
              <option value="">Pallet</option>{uniquePallets.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
          {uniqueConditions.length > 0 && (
            <select className="w-32 h-9 rounded-md border text-sm" value={condicaoFilter} onChange={(e) => setCondicaoFilter(e.target.value)}>
              <option value="">Condição</option>{uniqueConditions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {(searchTerm || palletFilter || condicaoFilter) && (
            <Button variant="ghost" size="sm" className="h-9 px-2 text-muted-foreground" onClick={() => { setSearchTerm(""); setPalletFilter(""); setCondicaoFilter(""); }}>Limpar</Button>
          )}
        </div>

        {loading && !isReprocessing ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : pageData.content.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>Nada encontrado.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 font-medium">Termo / Produto</th>
                    <th className="px-6 py-3 font-medium">Info. Lote</th>
                    <th className="px-6 py-3 font-medium text-blue-700">Valor Planilha</th>
                    <th className="px-6 py-3 font-medium text-foreground">Preço Encontrado</th>
                    <th className="px-6 py-3 font-medium">Status Robô</th>
                    <th className="px-6 py-3 font-medium">Revisão</th>
                    <th className="px-6 py-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageData.content.map((task) => (
                    <React.Fragment key={task.id}>
                      {/* LINHA PRINCIPAL */}
                      <tr className="hover:bg-muted/50 transition-colors">

                        <td className="px-6 py-4">
                          <div className="font-medium text-foreground truncate max-w-[400px]" title={task.termo_busca}>
                            {task.termo_busca}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={task.titulo_encontrado}>
                            {task.titulo_encontrado || "-"}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            {task.codPallet && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"><Box className="w-3 h-3" /> {task.codPallet}</span>}
                            {task.condicao && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200"><Tag className="w-3 h-3" /> {task.condicao}</span>}
                          </div>
                        </td>

                        <td className="px-6 py-4 font-mono font-medium text-blue-700 bg-blue-50/20">
                          {formatCurrency(task.custoUnitario)}
                        </td>

                        <td className="px-6 py-4 font-mono">
                          {task.preco ? formatCurrency(task.preco) : "-"}
                          {task.preco_desc && task.preco_desc !== task.preco && (
                            <span className="block text-[10px] text-green-600">
                              {formatCurrency(task.preco_desc)}
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col items-start gap-1.5">
                            {getStatusBadge(task.status)}
                            {task.status === "SIMILAR" && task.score > 0 && (
                              <div className="flex items-center gap-2 pl-1" title={`Similaridade: ${task.score}%`}>
                                <div className="h-1.5 w-12 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                  <div className={`h-full ${task.score > 85 ? 'bg-green-500' : task.score > 60 ? 'bg-yellow-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(task.score, 100)}%` }} />
                                </div>
                                <span className="text-[10px] font-medium text-slate-500">{task.score}%</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {getRevisaoBadge(task.statusRevisao)}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {task.link && (
                              <a href={task.link} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:bg-accent hover:text-blue-600" title="Ver Link">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            {task.status === "SIMILAR" && task.statusRevisao === "REPROVADO" && (
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" title="Aprovar" onClick={() => handleAprovar(task)}>
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            {task.status !== "BLOQUEADO" && (
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Editar" onClick={() => openEditModal(task)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* LINHA DE CANDIDATOS */}
                      {task.status === "SIMILAR" && task.candidatos && task.candidatos.length > 0 && (
                        <tr className="bg-blue-50/20">
                          <td colSpan={7} className="px-8 py-3 max-w-0 w-full">
                            <div className="flex flex-col gap-2 overflow-hidden">

                              <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide flex items-center gap-1.5">
                                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                                Selecione o produto correto:
                              </span>

                              <div className="flex flex-col gap-1.5">
                                {task.candidatos.map((candidato) => (
                                  <div
                                    key={candidato.id}
                                    onClick={() => handleEscolherCandidato(task.id, candidato.id)}
                                    className={`
                      flex items-center gap-4 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all min-w-0 overflow-hidden
                      ${candidato.escolhido
                                        ? 'bg-blue-100 border-blue-400 shadow-sm'
                                        : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                      }
                    `}
                                  >
                                    {/* Esquerda: radio + título */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                                      <div className={`
                        flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${candidato.escolhido ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}
                      `}>
                                        {candidato.escolhido && <Check className="w-3 h-3 text-white" />}
                                      </div>
                                      <span className={`text-sm truncate min-w-0 ${candidato.escolhido ? 'font-semibold text-blue-900' : 'text-gray-700'}`}>
                                        {candidato.titulo}
                                      </span>
                                    </div>

                                    {/* Direita: score + preço + link */}
                                    <div className="flex items-center gap-4 flex-shrink-0">

                                      <div className="flex items-center gap-1.5 flex-shrink-0" title={`Similaridade: ${candidato.matchScore}%`}>
                                        <div className="h-1.5 w-10 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                          <div className={`h-full ${candidato.matchScore > 85 ? 'bg-green-500' : candidato.matchScore > 60 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                                            style={{ width: `${Math.min(candidato.matchScore, 100)}%` }} />
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-medium w-7">{candidato.matchScore}%</span>
                                      </div>

                                      <div className="text-right flex-shrink-0 w-24">
                                        <div className="text-xs font-mono font-semibold text-gray-800 truncate">
                                          {formatCurrency(candidato.preco)}
                                        </div>
                                        {candidato.preco !== candidato.precoDesconto && (
                                          <div className="text-[10px] font-mono text-green-600 truncate">
                                            {formatCurrency(candidato.precoDesconto)}
                                          </div>
                                        )}
                                      </div>

                                      {candidato.link && (
                                        <a href={candidato.link} target="_blank" rel="noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="flex-shrink-0 p-1.5 rounded hover:bg-blue-200 transition text-blue-500 hover:text-blue-700">
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINAÇÃO */}
            {pageData.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
                <div className="text-sm text-muted-foreground">
                  Mostrando <strong>{pageData.number * pageData.size + 1}</strong> até{" "}
                  <strong>{Math.min((pageData.number + 1) * pageData.size, pageData.totalElements)}</strong> de{" "}
                  <strong>{pageData.totalElements}</strong> resultados
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} disabled={currentPage === 0} className="h-8 w-8 p-0">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pageData.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pageData.totalPages <= 5) pageNum = i;
                      else if (currentPage < 3) pageNum = i;
                      else if (currentPage > pageData.totalPages - 4) pageNum = pageData.totalPages - 5 + i;
                      else pageNum = currentPage - 2 + i;
                      return (
                        <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(pageNum)} className="h-8 w-8 p-0">
                          {pageNum + 1}
                        </Button>
                      );
                    })}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(pageData.totalPages - 1, prev + 1))} disabled={currentPage === pageData.totalPages - 1} className="h-8 w-8 p-0">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <EditSimilarModal open={isModalOpen} onOpenChange={setIsModalOpen} task={editingTask} onSave={handleSalvarCorrecao} />
    </div>
  );
}