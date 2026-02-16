import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Printer } from "lucide-react";
import Barcode from "react-barcode"; 

interface ProductData {
  nome: string;
  sku: string;
  precoVenda: number;
  precoMercado: number | null;
}

interface PrintLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductData | null;
}

export function PrintLabelModal({ isOpen, onClose, product }: PrintLabelModalProps) {
  if (!product) return null;

  const handlePrint = () => {
    window.print(); 
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl print:shadow-none print:border-none print:p-0">
        
        {/* O Header deve sumir na impressão */}
        <DialogHeader className="print:hidden">
          <DialogTitle>Pré-visualização da Etiqueta</DialogTitle>
        </DialogHeader>

        {/* --- ÁREA DA ETIQUETA --- */}
        {/* 
            AQUI ESTÁ A MÁGICA:
            print:fixed -> Tira do fluxo do modal e fixa na tela
            print:inset-0 -> Estica para ocupar a tela toda
            print:bg-white -> Garante fundo branco
            print:z-[9999] -> Fica em cima de tudo
            print:flex ... -> Centraliza a etiqueta na folha A4/Térmica
        */}
        <div className="flex justify-center py-8 bg-gray-100 rounded-lg print:fixed print:inset-0 print:bg-white print:z-[9999] print:flex print:items-center print:justify-center print:p-0 print:m-0">
          
          <div 
            id="printable-label"
            className="bg-white border-2 border-black w-[450px] h-[220px] p-4 flex gap-4 shadow-xl print:shadow-none print:border-2 print:border-black"
          >
            
            {/* COLUNA ESQUERDA: DADOS */}
            <div className="flex-1 flex flex-col justify-between">
              
              {/* 1. Nome Superior */}
              <div className="text-sm font-bold uppercase leading-tight line-clamp-2 h-10">
                {product.nome}
              </div>

              {/* 2. Preço de Venda (Grande) */}
              <div>
                <div className="flex items-start">
                  <span className="text-sm font-medium mt-1 mr-1">R$</span>
                  <span className="text-6xl font-black tracking-tighter">
                    {formatCurrency(product.precoVenda).split(',')[0]}
                    <span className="text-3xl align-top">,{formatCurrency(product.precoVenda).split(',')[1]}</span>
                  </span>
                </div>
                
                {/* 3. Preço ML (Menorzinho) */}
                {product.precoMercado && (
                  <div className="text-[10px] text-gray-500 font-medium -mt-1 ml-1">
                    Ref. Mercado: R$ {formatCurrency(product.precoMercado)}
                  </div>
                )}
              </div>

              {/* 4. Código de Barras (Inferior) */}
              <div className="-ml-3 mt-1 overflow-hidden">
                <Barcode 
                  value={product.sku} 
                  width={1.5} 
                  height={35} 
                  fontSize={10} 
                  margin={0}
                  displayValue={true} 
                />
              </div>
            </div>

            {/* COLUNA DIREITA: LOGO */}
            <div className="w-24 flex flex-col items-end justify-start pt-2">
                <div className="h-16 w-16 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-xl print:text-black print:bg-transparent print:border-2 print:border-black">
                    S
                </div>
                <span className="text-[10px] font-semibold mt-1 text-center w-full">
                    Sua Loja
                </span>
            </div>

          </div>
        </div>

        {/* Botões somem na impressão */}
        <div className="flex justify-end gap-2 mt-4 print:hidden">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}