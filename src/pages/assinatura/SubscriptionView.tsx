import { Button } from "../../components/ui/button";
import { Check, Crown } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";

export function SubscriptionView() {
  const currentPlan = {
    name: "Plano Pro",
    price: "R$ 199",
    period: "mês",
    renewDate: "15/01/2025",
    requestsUsed: 4500,
    requestsTotal: 10000,
  };

  const plans = [
    {
      name: "Básico",
      price: "R$ 99",
      period: "mês",
      requests: "5.000",
      features: [
        "5.000 consultas/mês",
        "1 usuário",
        "Suporte por email",
        "Exportação em Excel",
      ],
      current: false,
    },
    {
      name: "Pro",
      price: "R$ 199",
      period: "mês",
      requests: "10.000",
      features: [
        "10.000 consultas/mês",
        "3 usuários",
        "Suporte prioritário",
        "Exportação em Excel e CSV",
        "API de acesso",
      ],
      current: true,
      popular: true,
    },
    {
      name: "Enterprise",
      price: "R$ 499",
      period: "mês",
      requests: "Ilimitadas",
      features: [
        "Consultas ilimitadas",
        "Usuários ilimitados",
        "Suporte 24/7",
        "Exportação em todos os formatos",
        "API de acesso",
        "Integração personalizada",
      ],
      current: false,
    },
  ];

  const usagePercentage = (currentPlan.requestsUsed / currentPlan.requestsTotal) * 100;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Assinatura</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie seu plano e veja o uso do serviço
        </p>
      </div>

      {/* Current Plan Usage */}
      <div className="bg-white rounded-lg border border-border p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="mb-1">{currentPlan.name}</h3>
            <p className="text-muted-foreground text-sm">
              Renova em {currentPlan.renewDate}
            </p>
          </div>
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            Ativo
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Uso de Consultas</span>
            <span className="font-medium">
              {currentPlan.requestsUsed.toLocaleString()} / {currentPlan.requestsTotal.toLocaleString()}
            </span>
          </div>
          <Progress value={usagePercentage} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {Math.round(usagePercentage)}% utilizado neste mês
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <div>
        <h2 className="mb-6">Planos Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-lg border-2 p-6 relative ${
                plan.current
                  ? "border-primary"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    Popular
                  </Badge>
                </div>
              )}

              <div className="mb-6">
                <h4 className="mb-2">{plan.name}</h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {plan.requests} consultas/mês
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.current ? "outline" : "default"}
                disabled={plan.current}
              >
                {plan.current ? "Plano Atual" : "Selecionar Plano"}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h3 className="mb-4">Histórico de Pagamentos</h3>
        <div className="space-y-3">
          {[
            { date: "15/12/2024", amount: "R$ 199,00", status: "Pago" },
            { date: "15/11/2024", amount: "R$ 199,00", status: "Pago" },
            { date: "15/10/2024", amount: "R$ 199,00", status: "Pago" },
          ].map((payment, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-3 border-b border-border last:border-0"
            >
              <div>
                <p className="text-sm font-medium">{payment.date}</p>
                <p className="text-xs text-muted-foreground">Plano Pro</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{payment.amount}</p>
                <Badge variant="secondary" className="bg-green-500 text-white text-xs">
                  {payment.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
