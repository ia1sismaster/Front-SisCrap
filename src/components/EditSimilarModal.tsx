import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"; // Certifique-se de ter os componentes do Shadcn/ui ou use um modal simples
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface TaskData {
  id: number;
  titulo_encontrado: string;
  preco: string;
  preco_desc: string;
  link: string;
}

interface EditSimilarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskData | null;
  onSave: (data: any) => Promise<void>;
}

export function EditSimilarModal({ open, onOpenChange, task, onSave }: EditSimilarModalProps) {
  const [formData, setFormData] = useState({
    titulo: "",
    preco: "",
    precoDesc: "",
    link: "",
  });
  const [saving, setSaving] = useState(false);

  // Preenche o formulário quando a task muda
  useEffect(() => {
    if (task) {
      setFormData({
        titulo: task.titulo_encontrado || "",
        preco: task.preco || "",
        precoDesc: task.preco_desc || "",
        link: task.link || "",
      });
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        tarefaId: task?.id,
        ...formData
      });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Corrigir e Aprovar Item</DialogTitle>
          <DialogDescription>
            Ajuste os dados se o robô pegou algo errado. Ao salvar, o item será aprovado automaticamente.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="titulo">Título do Produto</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="preco">Preço (R$)</Label>
              <Input
                id="preco"
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="precoDesc">Obs. Preço (Ex: Pix)</Label>
              <Input
                id="precoDesc"
                value={formData.precoDesc}
                onChange={(e) => setFormData({ ...formData, precoDesc: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="link">Link do Produto</Label>
            <Input
              id="link"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar e Aprovar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}