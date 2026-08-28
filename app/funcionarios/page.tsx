import AppShell from '@/app/components/app-shell';
import { getDashboardData } from '@/lib/dashboard-data';
import { getCurrentAppUser, userHasPermission } from '@/lib/auth/current-user';
import { createEmployee, toggleEmployee, updateEmployee } from './actions';
import styles from './funcionarios.module.css';

function maskPhone(value: string) {
  if (!value) return 'Não cadastrado';
  const digits = value.replace(/\D/g, '');
  if (digits.length < 6) return value;
  return `${digits.slice(0, 4)}••••${digits.slice(-4)}`;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'PS';
}

export default async function EmployeesPage() {
  const [data, user] = await Promise.all([getDashboardData(), getCurrentAppUser()]);
  const active = data.employees.filter((employee) => employee.ativo);
  const sectors = Array.from(new Set(active.map((employee) => employee.setor).filter(Boolean)));
  const withWhatsapp = active.filter((employee) => employee.telefone).length;
  const canManage = userHasPermission(user, 'gerenciar_funcionarios');

  return (
    <AppShell active="funcionarios" source={data.source}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <p>EQUIPE · CADASTRO OPERACIONAL</p>
            <h1>Funcionários</h1>
            <span>Cadastros usados para setores, responsáveis e distribuição segura de tarefas. Não é uma área de RH; é uma referência operacional.</span>
          </div>
        </header>

        <section className={styles.summary}>
          <article><span>Ativos</span><strong>{active.length}</strong><small>pessoas disponíveis</small></article>
          <article><span>Setores reconhecidos</span><strong>{sectors.length}</strong><small>na operação atual</small></article>
          <article><span>Com WhatsApp</span><strong>{withWhatsapp}</strong><small>podem receber confirmação interna</small></article>
        </section>

        {canManage && (
          <details className={styles.createBox}>
            <summary>Adicionar funcionário à referência operacional</summary>
            <form action={createEmployee} className={styles.form}>
              <label className={styles.field}>Nome<input name="nome" required placeholder="Nome completo" /></label>
              <label className={styles.field}>Setor<input name="setor" required placeholder="Ex.: Pintura" /></label>
              <label className={styles.field}>Cargo<input name="cargo" placeholder="Ex.: Pintor" /></label>
              <label className={styles.field}>WhatsApp<input name="telefone" inputMode="tel" placeholder="55..." /></label>
              <div className={styles.formAction}><button className={styles.button} type="submit">Adicionar</button></div>
            </form>
          </details>
        )}

        <section className={styles.teamSection}>
          <div className={styles.sectionHead}>
            <div><p>REFERÊNCIA INTERNA</p><h2>Equipe reconhecida pelo PintService</h2></div>
            <span>{data.employees.length} cadastro(s)</span>
          </div>

          <div className={styles.list}>
            {data.employees.map((employee) => {
              const tasks = data.tasks.filter((task) => task.responsavel === employee.nome && ['aberta', 'em_execucao', 'aguardando_confirmacao'].includes(task.status));
              const row = (
                <>
                  <div className={styles.identity}>
                    <div className={styles.avatar}>{initials(employee.nome)}</div>
                    <div><strong>{employee.nome}</strong><span>{employee.cargo || 'Cargo não informado'}</span></div>
                  </div>
                  <div className={styles.cell}><span>Setor</span><strong>{employee.setor || 'Sem setor'}</strong></div>
                  <div className={styles.cell}><span>WhatsApp</span><strong>{maskPhone(employee.telefone)}</strong></div>
                  <div className={styles.cell}><span>Tarefas abertas</span><strong>{tasks.length}</strong></div>
                  <div className={styles.actions} style={{ gap: 7 }}>
                    <span className={`${styles.status} ${employee.ativo ? '' : styles.statusInactive}`}>{employee.ativo ? 'ativo' : 'inativo'}</span>
                    {canManage && <span className={`${styles.button} ${styles.buttonQuiet}`}>Editar</span>}
                  </div>
                </>
              );

              if (!canManage) {
                return <article className={`${styles.employee} ${employee.ativo ? '' : styles.employeeInactive}`} key={employee.id}>{row}</article>;
              }

              return (
                <details key={employee.id} className={employee.ativo ? '' : styles.employeeInactive}>
                  <summary className={styles.employee} style={{ listStyle: 'none', cursor: 'pointer' }}>{row}</summary>
                  <div className={styles.editPanel}>
                    <form action={updateEmployee} className={styles.editForm}>
                      <input type="hidden" name="id" value={employee.id}/>
                      <label className={styles.field}>Nome<input name="nome" defaultValue={employee.nome} required/></label>
                      <label className={styles.field}>Setor<input name="setor" defaultValue={employee.setor} required/></label>
                      <label className={styles.field}>Cargo<input name="cargo" defaultValue={employee.cargo}/></label>
                      <label className={styles.field}>WhatsApp<input name="telefone" defaultValue={employee.telefone}/></label>
                      <div className={styles.editActions}>
                        <button className={styles.button} type="submit">Salvar alterações</button>
                      </div>
                    </form>
                    <form action={toggleEmployee} className={styles.toggleForm}>
                      <input type="hidden" name="id" value={employee.id}/>
                      <input type="hidden" name="ativo" value={employee.ativo ? 'false' : 'true'}/>
                      <button className={`${styles.button} ${employee.ativo ? styles.buttonDanger : styles.buttonQuiet}`} type="submit">{employee.ativo ? 'Desativar cadastro' : 'Reativar cadastro'}</button>
                    </form>
                  </div>
                </details>
              );
            })}
          </div>

          {!data.employees.length && <div className={styles.empty}>Nenhum funcionário cadastrado ainda.</div>}
        </section>
      </div>
    </AppShell>
  );
}
