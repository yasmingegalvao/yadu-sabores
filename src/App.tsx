import { useEffect, useMemo, useState } from 'react'
import {
  Bike, Home, LogOut, MapPin, Menu, Package, Phone, Plus,
  Search, Settings, Trash2, Wallet, X, Pencil
} from 'lucide-react'

type StatusPedido = 'Recebido' | 'Em preparo' | 'A caminho' | 'Entregue' | 'Cancelado'
type StatusPagamento = 'Pago' | 'Pendente' | 'Receber na entrega'
type TipoEntrega = 'Entrega' | 'Retirada'

type Pedido = {
  id: number
  cliente: string
  telefone: string
  endereco: string
  bairro: string
  regiao: string
  entregador: string
  pagamento: string
  statusPagamento: StatusPagamento
  statusPedido: StatusPedido
  quantidade: number
  tipoEntrega: TipoEntrega
  total: number
  observacao: string
}

type Gasto = {
  id: number
  descricao: string
  valor: number
}

const VALOR_MARMITA = 25
const VALOR_ENTREGA = 5

const statusPedidos: StatusPedido[] = ['Recebido', 'Em preparo', 'A caminho', 'Entregue', 'Cancelado']
const entregadores = ['Arisson', 'Eduardo', 'Gonçalves']

const menuItems = [
  { name: 'Dashboard', icon: Home },
  { name: 'Pedidos', icon: Package },
  { name: 'Novo Pedido', icon: Plus },
  { name: 'Entregas', icon: Bike },
  { name: 'Financeiro', icon: Wallet },
  { name: 'Configurações', icon: Settings },
]

const pedidoVazio = {
  cliente: '',
  telefone: '',
  endereco: '',
  bairro: '',
  regiao: 'Zona Sul',
  entregador: '',
  pagamento: 'PIX',
  statusPagamento: 'Pendente' as StatusPagamento,
  statusPedido: 'Recebido' as StatusPedido,
  quantidade: 1,
  tipoEntrega: 'Entrega' as TipoEntrega,
  observacao: '',
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [page, setPage] = useState('Dashboard')
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<StatusPedido | 'Todos'>('Todos')
  const [abaPedidos, setAbaPedidos] = useState<'Ativos' | 'Concluídos'>('Ativos')
  const [editandoId, setEditandoId] = useState<number | null>(null)

  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
    const salvos = localStorage.getItem('yadu-pedidos')
    return salvos ? JSON.parse(salvos) : []
  })

  const [gastos, setGastos] = useState<Gasto[]>(() => {
    const salvos = localStorage.getItem('yadu-gastos')
    return salvos ? JSON.parse(salvos) : []
  })

  const [formPedido, setFormPedido] = useState(pedidoVazio)
  const [novoGasto, setNovoGasto] = useState({ descricao: '', valor: '' })

  useEffect(() => {
    localStorage.setItem('yadu-pedidos', JSON.stringify(pedidos))
  }, [pedidos])

  useEffect(() => {
    localStorage.setItem('yadu-gastos', JSON.stringify(gastos))
  }, [gastos])

  const totalForm =
    formPedido.quantidade * VALOR_MARMITA +
    (formPedido.tipoEntrega === 'Entrega' ? VALOR_ENTREGA : 0)

  const recebido = pedidos.filter(p => p.statusPagamento === 'Pago').reduce((s, p) => s + p.total, 0)
  const pendente = pedidos.filter(p => p.statusPagamento !== 'Pago').reduce((s, p) => s + p.total, 0)
  const totalGastos = gastos.reduce((s, g) => s + g.valor, 0)
  const lucro = recebido - totalGastos
  const marmitasVendidas = pedidos.reduce((s, p) => s + p.quantidade, 0)

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((p) => {
      const buscaOk = `${p.cliente} ${p.telefone} ${p.bairro} ${p.regiao} ${p.entregador}`
        .toLowerCase()
        .includes(busca.toLowerCase())

      const statusOk = filtroStatus === 'Todos' || p.statusPedido === filtroStatus
      const ativo = !['Entregue', 'Cancelado'].includes(p.statusPedido)
      const abaOk = abaPedidos === 'Ativos' ? ativo : !ativo

      return buscaOk && statusOk && abaOk
    })
  }, [pedidos, busca, filtroStatus, abaPedidos])

  function salvarPedido(e: React.FormEvent) {
    e.preventDefault()

    const pedido: Pedido = {
      id: editandoId ?? Date.now(),
      ...formPedido,
      total: totalForm,
    }

    if (editandoId) {
      setPedidos(atuais => atuais.map(p => p.id === editandoId ? pedido : p))
      setEditandoId(null)
    } else {
      setPedidos(atuais => [pedido, ...atuais])
    }

    setFormPedido(pedidoVazio)
    setPage('Pedidos')
  }

  function editarPedido(pedido: Pedido) {
    setEditandoId(pedido.id)
    setFormPedido({
      cliente: pedido.cliente,
      telefone: pedido.telefone,
      endereco: pedido.endereco,
      bairro: pedido.bairro,
      regiao: pedido.regiao,
      entregador: pedido.entregador,
      pagamento: pedido.pagamento,
      statusPagamento: pedido.statusPagamento,
      statusPedido: pedido.statusPedido,
      quantidade: pedido.quantidade,
      tipoEntrega: pedido.tipoEntrega,
      observacao: pedido.observacao,
    })
    setPage('Novo Pedido')
  }

  function excluirPedido(id: number) {
    setPedidos(atuais => atuais.filter(p => p.id !== id))
  }

  function mudarStatusPedido(id: number, status: StatusPedido) {
    setPedidos(atuais => atuais.map(p => p.id === id ? { ...p, statusPedido: status } : p))
  }

  function mudarStatusPagamento(id: number, status: StatusPagamento) {
    setPedidos(atuais => atuais.map(p => p.id === id ? { ...p, statusPagamento: status } : p))
  }

  function cadastrarGasto(e: React.FormEvent) {
    e.preventDefault()
    if (!novoGasto.descricao || !novoGasto.valor) return

    setGastos(atuais => [
      { id: Date.now(), descricao: novoGasto.descricao, valor: Number(novoGasto.valor) },
      ...atuais,
    ])

    setNovoGasto({ descricao: '', valor: '' })
  }

  return (
    <div className="min-h-screen bg-[#fff7ed] text-stone-800">
      <header className="sticky top-0 z-40 bg-gradient-to-r from-orange-500 to-orange-400 p-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={() => setMenuOpen(true)} className="rounded-xl p-2 active:bg-orange-600">
            <Menu size={28} />
          </button>

          <div>
            <h1 className="text-2xl font-extrabold">🍤 Yadu Sabores</h1>
            <p className="text-sm text-orange-100">Controle de pedidos e entregas</p>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40">
          <aside className="h-full w-72 bg-white p-4 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-orange-600">🍤 Yadu Sabores</h2>
              <button onClick={() => setMenuOpen(false)}><X /></button>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setPage(item.name)
                      setMenuOpen(false)
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left font-semibold ${
                      page === item.name ? 'bg-orange-100 text-orange-700' : 'hover:bg-orange-50'
                    }`}
                  >
                    <Icon size={20} />
                    {item.name}
                  </button>
                )
              })}

              <button className="mt-6 flex w-full items-center gap-3 rounded-2xl bg-orange-500 p-3 text-left font-bold text-white">
                <LogOut size={20} />
                Sair
              </button>
            </nav>
          </aside>
        </div>
      )}

      <main className="p-4 pb-24">
        {page === 'Dashboard' && (
          <section className="space-y-5">
            <div className="rounded-3xl bg-gradient-to-br from-orange-500 to-orange-400 p-5 text-white shadow-lg">
              <p className="text-sm text-orange-100">Bem-vinda ao</p>
              <h2 className="text-3xl font-extrabold">🍤 Yadu Sabores</h2>
              <p className="mt-1 text-sm text-orange-100">
                Organize pedidos, entregas e financeiro em um só lugar.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Card title="Pedidos" value={String(pedidos.length)} icon="📦" color="text-orange-600" />
              <Card title="Marmitas" value={String(marmitasVendidas)} icon="🍽️" color="text-orange-600" />
              <Card title="Recebido" value={`R$ ${recebido.toFixed(2)}`} icon="💰" color="text-green-600" />
              <Card title="Lucro" value={`R$ ${lucro.toFixed(2)}`} icon="📈" color={lucro >= 0 ? 'text-blue-600' : 'text-red-600'} />
            </div>

            <section className="rounded-3xl bg-white p-4 shadow">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-extrabold">📋 Status dos pedidos</h3>
                <button onClick={() => { setFiltroStatus('Todos'); setPage('Pedidos') }} className="text-sm font-bold text-orange-600">
                  Ver todos →
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {statusPedidos.map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      setFiltroStatus(status)
                      setAbaPedidos(['Entregue', 'Cancelado'].includes(status) ? 'Concluídos' : 'Ativos')
                      setPage('Pedidos')
                    }}
                    className={`rounded-2xl border p-4 text-left shadow-sm active:scale-95 ${statusStyle(status)}`}
                  >
                    <p className="text-2xl">{statusEmoji(status)}</p>
                    <p className="mt-1 text-sm font-bold">{status}</p>
                    <p className="text-2xl font-extrabold">
                      {pedidos.filter(p => p.statusPedido === status).length}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl bg-white p-4 shadow">
                <h3 className="mb-3 text-lg font-extrabold">💰 Financeiro</h3>
                <Linha texto="Recebido" valor={`R$ ${recebido.toFixed(2)}`} />
                <Linha texto="Pendente" valor={`R$ ${pendente.toFixed(2)}`} />
                <Linha texto="Gastos" valor={`R$ ${totalGastos.toFixed(2)}`} />
                <Linha texto="Lucro" valor={`R$ ${lucro.toFixed(2)}`} />
              </div>

              <div className="rounded-3xl bg-white p-4 shadow">
                <h3 className="mb-3 text-lg font-extrabold">⚡ Ações rápidas</h3>
                <div className="grid grid-cols-2 gap-3">
                  <QuickButton text="Novo Pedido" icon="➕" onClick={() => setPage('Novo Pedido')} primary />
                  <QuickButton text="Ver Pedidos" icon="📦" onClick={() => setPage('Pedidos')} />
                  <QuickButton text="Entregas" icon="🛵" onClick={() => setPage('Entregas')} />
                  <QuickButton text="Financeiro" icon="💰" onClick={() => setPage('Financeiro')} />
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-4 shadow">
              <h3 className="mb-3 text-lg font-extrabold">🛵 Entregadores</h3>
              <div className="grid gap-3 md:grid-cols-3">
                {entregadores.map(entregador => {
                  const total = pedidos.filter(p => p.entregador === entregador && p.tipoEntrega === 'Entrega').length

                  return (
                    <button
                      key={entregador}
                      onClick={() => setPage('Entregas')}
                      className="flex items-center justify-between rounded-2xl bg-orange-50 p-4 text-left"
                    >
                      <div>
                        <p className="font-extrabold">{entregador}</p>
                        <p className="text-sm text-stone-500">{total} entrega(s)</p>
                      </div>
                      <span className="rounded-full bg-orange-500 px-3 py-1 text-sm font-bold text-white">Ver</span>
                    </button>
                  )
                })}
              </div>
            </section>
          </section>
        )}

        {page === 'Novo Pedido' && (
          <section>
            <h2 className="mb-4 text-xl font-extrabold">
              {editandoId ? 'Editar Pedido' : 'Novo Pedido'}
            </h2>

            <form onSubmit={salvarPedido} className="space-y-4 rounded-3xl bg-white p-4 shadow">
              <Input label="Cliente" value={formPedido.cliente} onChange={v => setFormPedido({ ...formPedido, cliente: v })} required />
              <Input label="Telefone" value={formPedido.telefone} onChange={v => setFormPedido({ ...formPedido, telefone: v })} required />
              <Input label="Endereço" value={formPedido.endereco} onChange={v => setFormPedido({ ...formPedido, endereco: v })} required />
              <Input label="Bairro" value={formPedido.bairro} onChange={v => setFormPedido({ ...formPedido, bairro: v })} required />

              <Select label="Região" value={formPedido.regiao} onChange={v => setFormPedido({ ...formPedido, regiao: v })}>
                <option>Zona Sul</option>
                <option>Zona Leste</option>
                <option>Norte/Central</option>
              </Select>

              <Select label="Entregador" value={formPedido.entregador} onChange={v => setFormPedido({ ...formPedido, entregador: v })}>
                <option value="">Não definido</option>
                {entregadores.map(e => <option key={e}>{e}</option>)}
              </Select>

              <div>
                <p className="mb-2 font-bold">Quantidade de marmitas</p>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setFormPedido({ ...formPedido, quantidade: Math.max(1, formPedido.quantidade - 1) })} className="h-12 w-12 rounded-2xl bg-orange-100 text-xl font-extrabold">-</button>
                  <input
                    type="number"
                    min={1}
                    value={formPedido.quantidade}
                    onChange={e => setFormPedido({ ...formPedido, quantidade: Math.max(1, Number(e.target.value)) })}
                    className="w-24 rounded-2xl border border-orange-200 p-3 text-center font-bold"
                  />
                  <button type="button" onClick={() => setFormPedido({ ...formPedido, quantidade: formPedido.quantidade + 1 })} className="h-12 w-12 rounded-2xl bg-orange-500 text-xl font-extrabold text-white">+</button>
                </div>
              </div>

              <Select label="Tipo" value={formPedido.tipoEntrega} onChange={v => setFormPedido({ ...formPedido, tipoEntrega: v as TipoEntrega })}>
                <option>Entrega</option>
                <option>Retirada</option>
              </Select>

              <Select label="Forma de pagamento" value={formPedido.pagamento} onChange={v => setFormPedido({ ...formPedido, pagamento: v })}>
                <option>PIX</option>
                <option>Dinheiro</option>
                <option>Cartão</option>
              </Select>

              <Select label="Status do pagamento" value={formPedido.statusPagamento} onChange={v => setFormPedido({ ...formPedido, statusPagamento: v as StatusPagamento })}>
                <option>Pago</option>
                <option>Pendente</option>
                <option>Receber na entrega</option>
              </Select>

              <Select label="Status do pedido" value={formPedido.statusPedido} onChange={v => setFormPedido({ ...formPedido, statusPedido: v as StatusPedido })}>
                {statusPedidos.map(s => <option key={s}>{s}</option>)}
              </Select>

              <Input label="Observações" value={formPedido.observacao} onChange={v => setFormPedido({ ...formPedido, observacao: v })} />

              <div className="rounded-3xl bg-orange-50 p-4">
                <p>{formPedido.quantidade} x R$ 25,00 = R$ {(formPedido.quantidade * VALOR_MARMITA).toFixed(2)}</p>
                <p>Entrega: R$ {(formPedido.tipoEntrega === 'Entrega' ? VALOR_ENTREGA : 0).toFixed(2)}</p>
                <strong className="mt-2 block text-2xl text-orange-600">Total: R$ {totalForm.toFixed(2)}</strong>
              </div>

              <button className="w-full rounded-2xl bg-orange-500 p-4 font-extrabold text-white shadow">
                {editandoId ? 'Salvar Alterações' : 'Salvar Pedido'}
              </button>
            </form>
          </section>
        )}

        {page === 'Pedidos' && (
          <section>
            <h2 className="mb-4 text-xl font-extrabold">Pedidos</h2>

            <div className="mb-4 grid grid-cols-2 gap-2">
              <button onClick={() => setAbaPedidos('Ativos')} className={`rounded-2xl p-3 font-bold ${abaPedidos === 'Ativos' ? 'bg-orange-500 text-white' : 'bg-white text-orange-600'}`}>Ativos</button>
              <button onClick={() => setAbaPedidos('Concluídos')} className={`rounded-2xl p-3 font-bold ${abaPedidos === 'Concluídos' ? 'bg-orange-500 text-white' : 'bg-white text-orange-600'}`}>Concluídos</button>
            </div>

            <div className="mb-4 flex items-center gap-2 rounded-2xl bg-white p-3 shadow">
              <Search size={18} className="text-orange-500" />
              <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar pedido..." className="w-full outline-none" />
            </div>

            {filtroStatus !== 'Todos' && (
              <button onClick={() => setFiltroStatus('Todos')} className="mb-4 rounded-2xl bg-orange-100 px-4 py-2 text-sm font-bold text-orange-700">
                Filtro: {filtroStatus} ×
              </button>
            )}

            <div className="space-y-4">
              {pedidosFiltrados.length === 0 && (
                <div className="rounded-3xl bg-white p-6 text-center shadow">
                  <p className="text-stone-500">Nenhum pedido encontrado.</p>
                </div>
              )}

              {pedidosFiltrados.map(pedido => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  onEdit={editarPedido}
                  onDelete={excluirPedido}
                  onStatusPedido={mudarStatusPedido}
                  onStatusPagamento={mudarStatusPagamento}
                />
              ))}
            </div>
          </section>
        )}

        {page === 'Entregas' && (
          <section>
            <h2 className="mb-4 text-xl font-extrabold">Entregas</h2>

            <div className="space-y-4">
              {entregadores.map(entregador => {
                const lista = pedidos.filter(p => p.entregador === entregador && p.tipoEntrega === 'Entrega' && !['Entregue', 'Cancelado'].includes(p.statusPedido))

                return (
                  <div key={entregador} className="rounded-3xl bg-white p-4 shadow">
                    <h3 className="mb-3 text-lg font-extrabold">🛵 {entregador}</h3>

                    {lista.length === 0 && <p className="text-sm text-stone-500">Nenhuma entrega ativa.</p>}

                    <div className="space-y-3">
                      {lista.map(p => (
                        <div key={p.id} className="rounded-2xl bg-orange-50 p-3">
                          <strong>{p.cliente}</strong>
                          <p className="text-sm">{p.bairro} - {p.regiao}</p>
                          <p className="text-sm font-bold text-orange-600">{p.statusPedido}</p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <a className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-orange-600" href={`https://wa.me/55${p.telefone}`} target="_blank">WhatsApp</a>
                            <a className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-orange-600" href={mapsLink(p)} target="_blank">Maps</a>
                            <button onClick={() => mudarStatusPedido(p.id, 'A caminho')} className="rounded-xl bg-blue-100 px-3 py-2 text-sm font-bold text-blue-700">A caminho</button>
                            <button onClick={() => mudarStatusPedido(p.id, 'Entregue')} className="rounded-xl bg-green-100 px-3 py-2 text-sm font-bold text-green-700">Entregue</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {page === 'Financeiro' && (
          <section>
            <h2 className="mb-4 text-xl font-extrabold">Financeiro</h2>

            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Card title="Recebido" value={`R$ ${recebido.toFixed(2)}`} icon="💰" color="text-green-600" />
              <Card title="Pendente" value={`R$ ${pendente.toFixed(2)}`} icon="⏳" color="text-yellow-600" />
              <Card title="Gastos" value={`R$ ${totalGastos.toFixed(2)}`} icon="💸" color="text-red-600" />
              <Card title="Lucro" value={`R$ ${lucro.toFixed(2)}`} icon="📈" color={lucro >= 0 ? 'text-blue-600' : 'text-red-600'} />
            </div>

            <form onSubmit={cadastrarGasto} className="mb-4 space-y-3 rounded-3xl bg-white p-4 shadow">
              <h3 className="font-extrabold">Adicionar gasto</h3>
              <Input label="Descrição" value={novoGasto.descricao} onChange={v => setNovoGasto({ ...novoGasto, descricao: v })} required />
              <Input label="Valor" value={novoGasto.valor} onChange={v => setNovoGasto({ ...novoGasto, valor: v })} required />

              <button className="w-full rounded-2xl bg-orange-500 p-3 font-extrabold text-white">
                Salvar gasto
              </button>
            </form>

            <div className="rounded-3xl bg-white p-4 shadow">
              <h3 className="mb-3 font-extrabold">Gastos cadastrados</h3>

              {gastos.length === 0 && <p className="text-sm text-stone-500">Nenhum gasto cadastrado.</p>}

              {gastos.map(g => (
                <div key={g.id} className="flex items-center justify-between border-b py-3 last:border-b-0">
                  <div>
                    <strong>{g.descricao}</strong>
                    <p className="text-sm text-red-600">R$ {g.valor.toFixed(2)}</p>
                  </div>

                  <button onClick={() => setGastos(atuais => atuais.filter(item => item.id !== g.id))} className="text-red-600">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {page === 'Configurações' && (
          <section className="rounded-3xl bg-white p-6 shadow">
            <h2 className="text-2xl font-extrabold">Configurações</h2>
            <p className="mt-2">Valor da marmita: R$ {VALOR_MARMITA.toFixed(2)}</p>
            <p>Taxa de entrega: R$ {VALOR_ENTREGA.toFixed(2)}</p>
            <p>Entregadores: Arisson, Eduardo e Gonçalves</p>
          </section>
        )}
      </main>
    </div>
  )
}

function PedidoCard({
  pedido, onEdit, onDelete, onStatusPedido, onStatusPagamento
}: {
  pedido: Pedido
  onEdit: (pedido: Pedido) => void
  onDelete: (id: number) => void
  onStatusPedido: (id: number, status: StatusPedido) => void
  onStatusPagamento: (id: number, status: StatusPagamento) => void
}) {
  return (
    <article className="rounded-3xl bg-white p-4 shadow">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-extrabold">Pedido #{String(pedido.id).slice(-4)}</h3>
          <p className="text-sm text-stone-500">{pedido.cliente}</p>
        </div>

        <span className={`rounded-full px-3 py-1 text-sm font-bold ${badgeStatus(pedido.statusPedido)}`}>
          {pedido.statusPedido}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <a href={`https://wa.me/55${pedido.telefone}`} target="_blank" className="flex items-center gap-2 text-orange-600 underline">
          <Phone size={16} /> {pedido.telefone}
        </a>

        <a href={mapsLink(pedido)} target="_blank" className="flex items-center gap-2 text-orange-600 underline">
          <MapPin size={16} /> {pedido.endereco}
        </a>

        <p><strong>Bairro:</strong> {pedido.bairro}</p>
        <p><strong>Região:</strong> {pedido.regiao}</p>
        <p><strong>Entregador:</strong> {pedido.entregador || 'Não definido'}</p>
        <p><strong>Quantidade:</strong> {pedido.quantidade} marmita(s)</p>
        <p><strong>Total:</strong> R$ {pedido.total.toFixed(2)}</p>
        <p><strong>Pagamento:</strong> {pedido.pagamento} - {pedido.statusPagamento}</p>
        {pedido.observacao && <p><strong>Obs:</strong> {pedido.observacao}</p>}
      </div>

      <div className="mt-4 grid gap-3">
        <Select label="Status do pedido" value={pedido.statusPedido} onChange={v => onStatusPedido(pedido.id, v as StatusPedido)}>
          {statusPedidos.map(s => <option key={s}>{s}</option>)}
        </Select>

        <Select label="Status do pagamento" value={pedido.statusPagamento} onChange={v => onStatusPagamento(pedido.id, v as StatusPagamento)}>
          <option>Pago</option>
          <option>Pendente</option>
          <option>Receber na entrega</option>
        </Select>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => onEdit(pedido)} className="flex items-center justify-center gap-2 rounded-2xl bg-orange-100 p-3 font-bold text-orange-700">
            <Pencil size={16} /> Editar
          </button>

          <button onClick={() => onDelete(pedido.id)} className="flex items-center justify-center gap-2 rounded-2xl bg-red-50 p-3 font-bold text-red-600">
            <Trash2 size={16} /> Excluir
          </button>
        </div>
      </div>
    </article>
  )
}

function Card({ title, value, color, icon }: { title: string; value: string; color: string; icon: string }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow">
      <div className="mb-2 text-3xl">{icon}</div>
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className={`text-2xl font-extrabold ${color}`}>{value}</h3>
    </div>
  )
}

function QuickButton({ text, icon, onClick, primary = false }: { text: string; icon: string; onClick: () => void; primary?: boolean }) {
  return (
    <button onClick={onClick} className={`rounded-2xl p-4 text-center font-extrabold shadow-sm active:scale-95 ${primary ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700'}`}>
      <div className="text-2xl">{icon}</div>
      {text}
    </button>
  )
}

function Linha({ texto, valor }: { texto: string; valor: string }) {
  return (
    <div className="flex justify-between border-b py-3 last:border-b-0">
      <span>{texto}</span>
      <strong>{valor}</strong>
    </div>
  )
}

function Input({ label, value, onChange, required = false }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <label className="block font-bold">
      {label}
      <input
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border border-orange-200 p-3 font-normal outline-orange-500"
      />
    </label>
  )
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="block font-bold">
      {label}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border border-orange-200 bg-white p-3 font-normal outline-orange-500"
      >
        {children}
      </select>
    </label>
  )
}

function statusEmoji(status: StatusPedido) {
  if (status === 'Recebido') return '🟡'
  if (status === 'Em preparo') return '🍳'
  if (status === 'A caminho') return '🛵'
  if (status === 'Entregue') return '✅'
  return '❌'
}

function statusStyle(status: StatusPedido) {
  if (status === 'Recebido') return 'border-yellow-200 bg-yellow-50 text-yellow-700'
  if (status === 'Em preparo') return 'border-orange-200 bg-orange-50 text-orange-700'
  if (status === 'A caminho') return 'border-blue-200 bg-blue-50 text-blue-700'
  if (status === 'Entregue') return 'border-green-200 bg-green-50 text-green-700'
  return 'border-red-200 bg-red-50 text-red-700'
}

function badgeStatus(status: StatusPedido) {
  if (status === 'Recebido') return 'bg-yellow-100 text-yellow-700'
  if (status === 'Em preparo') return 'bg-orange-100 text-orange-700'
  if (status === 'A caminho') return 'bg-blue-100 text-blue-700'
  if (status === 'Entregue') return 'bg-green-100 text-green-700'
  return 'bg-red-100 text-red-700'
}

function mapsLink(pedido: Pedido) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${pedido.endereco} ${pedido.bairro} Porto Velho`
  )}`
}

export default App