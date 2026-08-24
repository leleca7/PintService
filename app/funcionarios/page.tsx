import AppShell from '@/app/components/app-shell';
import { getDashboardData } from '@/lib/dashboard-data';
import { getCurrentAppUser, userHasPermission } from '@/lib/auth/current-user';
import { createEmployee, toggleEmployee } from './actions';

function maskPhone(value: string) {
  if (!value) return 'Sem WhatsApp cadastrado';
  if (value.includes('•')) return value;
  const digits = value.replace(/\D/g, '');
  if (digits.length < 6) return value;
  return `${digits.slice(0, 4)}••••${digits.slice(-4)}`;
}

export default async function EmployeesPage() {
  const [data, user] = await Promise.all([getDashboardData(), getCurrentAppUser()]);
  const active = data.employees.filter((employee) => employee.ativo);
  const sectors = Array.from(new Set(active.map((employee) => employee.setor).filter(Boolean)));
  const canManage = userHasPermission(user, 'gerenciar_funcionarios');

  return (
    <AppShell active="funcionarios" source={data.source}>
      <header className="topbar"><div><p className="eyebrow">EQUIPE</p><h1>Funcionários</h1><p>Cadastro usado para reconhecer números internos, setores e responsáveis por tarefas.</p></div></header>

      <section className="metrics compact-metrics">
        <article><div className="metric-icon">👷</div><div><span>Ativos</span><strong>{active.length}</strong><small>pessoas disponíveis</small></div></article>
        <article><div className="metric-icon">▦</div><div><span>Setores</span><strong>{sectors.length}</strong><small>com pessoas cadastradas</small></div></article>
        <article><div className="metric-icon">💬</div><div><span>Com WhatsApp</span><strong>{active.filter((employee) => employee.telefone).length}</strong><small>podem receber tarefas internas</small></div></article>
        <article><div className="metric-icon">🔒</div><div><span>Acesso</span><strong>RBAC</strong><small>cadastro só com permissão</small></div></article>
      </section>

      {canManage && <section className="panel page-panel"><div className="panel-head"><div><p className="eyebrow">NOVO FUNCIONÁRIO</p><h2>Adicionar à equipe</h2></div></div><form action={createEmployee} className="settings-grid"><label>Nome<input name="nome" required placeholder="Nome completo" /></label><label>Setor<input name="setor" required placeholder="Ex.: Pintura" /></label><label>Cargo<input name="cargo" placeholder="Ex.: Pintor" /></label><label>WhatsApp<input name="telefone" inputMode="tel" placeholder="55..." /></label><div><button className="ghost action-link" type="submit">Adicionar funcionário</button></div></form></section>}

      <section className="panel page-panel">
        <div className="panel-head"><div><p className="eyebrow">CADASTRO INTERNO</p><h2>Equipe reconhecida pelo sistema</h2></div></div>
        <div className="employee-grid">
          {data.employees.map((employee) => {
            const tasks = data.tasks.filter((task) => task.responsavel === employee.nome && ['aberta', 'em_execucao', 'aguardando_confirmacao'].includes(task.status));
            return <article className="employee-card" key={employee.id}><div className="employee-head"><div className="avatar employee-avatar">{employee.nome.slice(0, 2).toUpperCase()}</div><div><h3>{employee.nome}</h3><p>{employee.cargo || 'Cargo não informado'}</p></div><span className={employee.ativo ? 'tag ai' : 'tag human'}>{employee.ativo ? 'ativo' : 'inativo'}</span></div><dl><div><dt>Setor</dt><dd>{employee.setor || 'Sem setor'}</dd></div><div><dt>WhatsApp</dt><dd>{maskPhone(employee.telefone)}</dd></div><div><dt>Tarefas abertas</dt><dd>{tasks.length}</dd></div></dl>{canManage && <form action={toggleEmployee}><input type="hidden" name="id" value={employee.id} /><input type="hidden" name="ativo" value={employee.ativo ? 'false' : 'true'} /><button className="ghost action-link" type="submit">{employee.ativo ? 'Desativar' : 'Ativar'}</button></form>}</article>;
          })}
        </div>
        {!data.employees.length && <div className="empty-state">Nenhum funcionário cadastrado ainda.</div>}
      </section>
    </AppShell>
  );
}
