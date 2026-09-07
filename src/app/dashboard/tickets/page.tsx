import CabinetSubpage from '@/components/CabinetSubpage';
import TicketsHub from '@/components/TicketsHub';

export default function DashboardTicketsPage() {
  return (
    <CabinetSubpage
      title="Билеты"
      lead="Покажите QR на входе. На двери площадки — общий QR."
    >
      <TicketsHub inCabinet />
    </CabinetSubpage>
  );
}
