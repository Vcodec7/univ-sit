import CabinetShell from '@/components/CabinetShell';

/** Auth-gated cabinet — never prerender as a public static page. */
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <CabinetShell>
      {children}
      {modal}
    </CabinetShell>
  );
}
