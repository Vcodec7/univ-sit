import CabinetSubpage from '@/components/CabinetSubpage';
import TicketsHub from '@/components/TicketsHub';
import { BOOKING_TABS } from '@/lib/cabinet-nav';

export default function DashboardTicketsPage() {
  return (
    <CabinetSubpage
      title="Билеты и заявки"
      lead="QR на входе и статусы заявок в одном месте."
      tabs={BOOKING_TABS}
    >
      <TicketsHub inCabinet />
    </CabinetSubpage>
  );
}
