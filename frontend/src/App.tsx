import { Settings, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AdminLayout, type AdminPage } from "./components/admin/AdminLayout";
import { apiGet, apiPatch } from "./api/http";
import { LoginPage } from "./pages/LoginPage";
import { CustomerPortal } from "./pages/customer/CustomerPortal";
import { BlockedTimesPage } from "./pages/admin/BlockedTimesPage";
import { BookingsPage } from "./pages/admin/BookingsPage";
import { CourtsPage } from "./pages/admin/CourtsPage";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { PlaceholderPage } from "./pages/admin/PlaceholderPage";
import type {
  BlockedTime,
  BlockedTimesResponse,
  Booking,
  BookingResponse,
  BookingsResponse,
  BookingStatus,
  Court,
  CourtsResponse,
  UserSummary,
} from "./types/api";

const TOKEN_STORAGE_KEY = "quadrafacil.sessionToken";
const USER_STORAGE_KEY = "quadrafacil.sessionUser";

export default function App() {
  const [activePage, setActivePage] = useState<AdminPage>("dashboard");
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || "");
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as UserSummary;
    } catch {
      return null;
    }
  });
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [isLoadingCourts, setIsLoadingCourts] = useState(true);
  const [isLoadingAdminData, setIsLoadingAdminData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blockedTimesWithCourts = useMemo(
    () =>
      blockedTimes.map((blockedTime) => ({
        ...blockedTime,
        court: courts.find((court) => court.id === blockedTime.courtId) || blockedTime.court,
      })),
    [blockedTimes, courts],
  );

  useEffect(() => {
    if (token && currentUser) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
      return;
    }

    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }, [currentUser, token]);

  useEffect(() => {
    let isMounted = true;

    async function loadCourts() {
      try {
        setIsLoadingCourts(true);
        const response = await apiGet<CourtsResponse>("/courts");

        if (isMounted) {
          setCourts(response.courts);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Erro ao carregar quadras");
        }
      } finally {
        if (isMounted) {
          setIsLoadingCourts(false);
        }
      }
    }

    void loadCourts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!token || currentUser?.role !== "ADMIN") {
      setBookings([]);
      setBlockedTimes([]);
      return;
    }

    let isMounted = true;

    async function loadAdminData() {
      try {
        setIsLoadingAdminData(true);
        setError(null);
        const [bookingsResponse, blockedTimesResponse] = await Promise.all([
          apiGet<BookingsResponse>("/bookings", { token }),
          apiGet<BlockedTimesResponse>("/blocked-times", { token }),
        ]);

        if (isMounted) {
          setBookings(bookingsResponse.bookings);
          setBlockedTimes(blockedTimesResponse.blockedTimes);
        }
      } catch (loadError) {
        if (isMounted) {
          setBookings([]);
          setBlockedTimes([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Erro ao carregar dados administrativos",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingAdminData(false);
        }
      }
    }

    void loadAdminData();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.role, token]);

  async function updateBookingStatus(bookingId: string, status: BookingStatus) {
    if (!token) {
      setError("Informe o token admin para alterar reservas");
      return;
    }

    const response = await apiPatch<BookingResponse>(
      `/bookings/${bookingId}/status`,
      { status },
      token,
    );

    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.id === bookingId ? { ...booking, ...response.booking } : booking,
      ),
    );
  }

  function handleAuthenticated(session: { token: string; user: UserSummary }) {
    setToken(session.token);
    setCurrentUser(session.user);
    setError(null);
  }

  function handleLogout() {
    setToken("");
    setCurrentUser(null);
    setBookings([]);
    setBlockedTimes([]);
    setActivePage("dashboard");
  }

  function renderPage() {
    if (activePage === "dashboard") {
      return (
        <DashboardPage
          courts={courts}
          bookings={bookings}
          isLoading={isLoadingCourts || isLoadingAdminData}
        />
      );
    }

    if (activePage === "courts") {
      return <CourtsPage courts={courts} isLoading={isLoadingCourts} />;
    }

    if (activePage === "bookings") {
      return (
        <BookingsPage
          bookings={bookings}
          isLoading={isLoadingAdminData}
          onUpdateStatus={updateBookingStatus}
        />
      );
    }

    if (activePage === "blocked") {
      return <BlockedTimesPage blockedTimes={blockedTimesWithCourts} isLoading={isLoadingAdminData} />;
    }

    if (activePage === "users") {
      return (
        <PlaceholderPage
          icon={Users}
          title="Usuários"
          description="Gerenciamento de usuários comuns e administradores."
        />
      );
    }

    return (
      <PlaceholderPage
        icon={Settings}
        title="Configurações"
        description="Preferências do sistema, políticas de reserva e parâmetros administrativos."
      />
    );
  }

  if (!token || !currentUser) {
    return <LoginPage onAuthenticated={handleAuthenticated} />;
  }

  if (currentUser.role !== "ADMIN") {
    return <CustomerPortal token={token} user={currentUser} onLogout={handleLogout} />;
  }

  return (
    <AdminLayout
      activePage={activePage}
      onNavigate={setActivePage}
      adminName={currentUser.name}
      onLogout={handleLogout}
    >
      {error ? (
        <div className="mb-4 rounded-md border border-danger/30 bg-background p-4 text-sm text-danger">
          {error}
        </div>
      ) : null}
      {renderPage()}
    </AdminLayout>
  );
}
