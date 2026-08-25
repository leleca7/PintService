import AppShell from '@/app/components/app-shell';
import { getDashboardData } from '@/lib/dashboard-data';
import { getCurrentAppUser, userHasPermission } from '@/lib/auth/current-user';
import { createEmployee, toggleEmployee, updateEmployee } from './actions';

function maskPhone(value: string) {
  if (!value) return 'Sem WhatsApp cadastrado';
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
      <header className="topbar"><div><p className="eyebrow">EQUIPE</p><h1>Funcionários</h1><p>Cadastro real usado para setores, acessos e distribuição segura de tarefas.</p></div></header>

      <section className="metrics compact-metrics">
        <article><div className="metric-icon">AT</div><div><span>Ativos</span><strong>{active.length}</strong><small>pessoas disponíveis</small></div></article>
        <article><div className="metric-icon">ST</div><div><span>Setores</span><strong>{sectors.length}</strong><small>com pessoas cadastradas</small></div></article>
        <article><div className="metric-icon">WA</div><div><span>Com WhatsApp</span><strong>{active.filter((employee) => employee.telefone).length}</strong><small>podem receber tarefas internas</small></div></article>
        <article><div className="metric-icon">RB</div><div><span>Controle</span><strong>RBAC</strong><small>alteração somente com permissão</small></div></article>
      </section>

      {canManage && (
        <section className="panel page-panel">
          <div className="panel-head"><div><p className="eyebrow">NOVO FUNCIONÁRIO</p><h2>Adicionar à equipe</h2></div></div>
          <form action={createEmployee} className="settings-grid">
            <label>Nome<input name="nome" required placeholder="Nome completo" /></label>
            <label>Setor<input name="setor" required placeholder="Ex.: Pintura" /></label>
            <label>Cargo<input name="cargo" placeholder="Ex.: Pintor" /></label>
            <label>WhatsApp<input name="telefone" inputMode="tel" placeholder="55..." /></label>
            <div><button className="ghost action-link" type="submit">Adicionar funcionário</button></div>
          </form>
        </section>
      )}

      <section className="panel page-panel">
        <div className="panel-head"><div><p className="eyebrow">CADASTRO INTERNO</p><h2>Equipe reconhecida pelo sistema</h2></div></div>
        <div className="employee-grid">
          {data.employees.map((employee) => {
            const tasks = data.tasks.filter((task) => task.responsavel === employee.nome && ['aberta', 'em_execucao', 'aguardando_confirmacao'].includes(task.status));
            return (
              <article className="employee-card" key={employee.id}>
                <div className="employee-head"><div className="avatar employee-avatar">{employee.nome.slice(0, 2).toUpperCase()}</div><div><h3>{employee.nome}</h3><p>{employee.cargo || 'Cargo não informado'}</p></div><span className={employee.ativo ? 'tag ai' : 'tag human'}>{employee.ativo ? 'ativo' : 'inativo'}</span></div>
                <dl><div><dt>Setor</dt><dd>{employee.setor || 'Sem setor'}</dd></div><div><dt>WhatsApp</dt><dd>{maskPhone(employee.telefone)}</dd></div><div><dt>Tarefas abertas</dt><dd>{tasks.length}</dd></div></dl>
                {canManage && <form action={updateEmployee} className="employee-edit-form"><input type="hidden" name="id" value={employee.id}/><label>Nome<input name="nome" defaultValue={employee.nome} required/></label><label>Setor<input name="setor" defaultValue={employee.setor} required/></label><label>Cargo<input name="cargo" defaultValue={employee.cargo}/></label><label>WhatsApp<input name="telefone" defaultValue={employee.telefone}/></label><button className="ghost action-link" type="submit">Salvar alterações</button></form>}
                {canManage && <form action={toggleEmployee}><input type="hidden" name="id" value={employee.id}/><input type="hidden" name="ativo" value={employee.ativo ? 'false' : 'true'}/><button className="ghost action-link" type="submit">{employee.ativo ? 'Desativar' : 'Ativar'}</button></form>}
              </article>
            );
          })}
        </div>
        {!data.employees.length && <div className="empty-state">Nenhum funcionário cadastrado ainda.</div>}
      </section>
    </AppShell>
  );
}
