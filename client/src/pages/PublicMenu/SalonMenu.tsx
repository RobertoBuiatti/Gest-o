import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import styles from "./PublicMenu.module.css";

interface Category {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes?: number;
  price?: number;
  category: { id: string; name: string };
}

interface MenuData {
  products: Service[];
  categories: Category[];
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function timeToMinutes(t: string) {
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
}

function minutesToTime(m: number) {
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${pad(hh)}:${pad(mm)}`;
}

function generateTimeSlots(start = "08:00", end = "18:00", stepMin = 30) {
  const slots: string[] = [];
  let cur = timeToMinutes(start);
  const last = timeToMinutes(end);
  while (cur <= last) {
    slots.push(minutesToTime(cur));
    cur += stepMin;
  }
  return slots;
}

export default function SalonMenu() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toISOString().split("T")[0],
  );
  const [selectedTime, setSelectedTime] = useState<string>("08:00");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [appointmentsOnDay, setAppointmentsOnDay] = useState<any[]>([]);
  const [checking, setChecking] = useState(false);

  const { data, isLoading } = useQuery<MenuData>({
    queryKey: ["public-salon-menu"],
    queryFn: async () => {
      try {
        const pubRes = await fetch("/api/public/salon/services");
        if (pubRes.ok) {
          const services = await pubRes.json();
          const categoriesMap: Record<string, { id: string; name: string }> = {};
          for (const s of services) {
            const c = s.category;
            if (c && !categoriesMap[c.id]) categoriesMap[c.id] = { id: c.id, name: c.name };
          }
          return {
            products: services,
            categories: Object.values(categoriesMap).length ? Object.values(categoriesMap) : [{ id: "default", name: "Serviços" }],
          } as MenuData;
        }
      } catch (e) {
        // ignore
      }

      try {
        const res = await fetch("/api/salon/services");
        if (res.ok) {
          const services = await res.json();
          const categoriesMap: Record<string, { id: string; name: string }> = {};
          for (const s of services) {
            const c = s.category;
            if (c && !categoriesMap[c.id]) categoriesMap[c.id] = { id: c.id, name: c.name };
          }
          return {
            products: services,
            categories: Object.values(categoriesMap).length ? Object.values(categoriesMap) : [{ id: "default", name: "Serviços" }],
          } as MenuData;
        }
      } catch (e) {
        // ignore
      }

      return { products: [], categories: [{ id: "default", name: "Serviços" }] } as MenuData;
    },
  });

  const services = selectedCategory ? data?.products.filter((p) => p.category.id === selectedCategory) : data?.products;

  useEffect(() => {
    if (data?.categories && data.categories.length > 0 && !selectedCategory) {
      setSelectedCategory(data.categories[0].id);
    }
  }, [data, selectedCategory]);

  const baseSlots = useMemo(() => generateTimeSlots("08:00", "18:00", 30), []);

  useEffect(() => {
    async function fetchDay() {
      setChecking(true);
      try {
        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);
        const res = await fetch(
          `/api/public/salon/appointments?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`,
        );
        if (!res.ok) {
          setAppointmentsOnDay([]);
          setChecking(false);
          return;
        }
        const appts = await res.json();
        setAppointmentsOnDay(appts || []);
      } catch (err) {
        console.error(err);
        setAppointmentsOnDay([]);
      } finally {
        setChecking(false);
      }
    }
    fetchDay();
  }, [selectedDate]);

  const availability = useMemo(() => {
    const map: Record<string, boolean> = {};
    const selectedService = data?.products.find((p) => p.id === selectedServiceId);
    const durationMin = selectedService?.durationMinutes || 60;

    const apIntervals = appointmentsOnDay.map((a: any) => {
      const aStart = new Date(a.date || a.appointmentAt || a.createdAt);
      const aEnd = new Date(aStart.getTime() + ((a.service?.durationMinutes || durationMin) * 60000));
      return { start: aStart, end: aEnd };
    });

    for (const slot of baseSlots) {
      const [hh, mm] = slot.split(":").map(Number);
      const slotStart = new Date(selectedDate + "T00:00:00");
      slotStart.setHours(hh, mm, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + durationMin * 60000);

      const overlap = apIntervals.some((ap) => slotStart < ap.end && slotEnd > ap.start);
      map[slot] = !overlap;
    }
    return map;
  }, [baseSlots, appointmentsOnDay, selectedServiceId, data, selectedDate]);

  const handleSelectSlot = (slot: string) => {
    if (!availability[slot]) return;
    setSelectedTime(slot);
  };

  const handleSubmit = async () => {
    if (!selectedServiceId) {
      alert("Selecione um serviço.");
      return;
    }
    if (!selectedDate || !selectedTime) {
      alert("Escolha data e horário.");
      return;
    }
    if (!customerName.trim()) {
      alert("Informe seu nome.");
      return;
    }

    const iso = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();

    const durationMin = data?.products.find((p) => p.id === selectedServiceId)?.durationMinutes || 60;
    const selStart = new Date(iso);
    const selEnd = new Date(selStart.getTime() + durationMin * 60000);
    const conflict = appointmentsOnDay.some((a: any) => {
      const aStart = new Date(a.date || a.appointmentAt || a.createdAt);
      const aEnd = new Date(aStart.getTime() + ((a.service?.durationMinutes || durationMin) * 60000));
      return selStart < aEnd && selEnd > aStart;
    });
    if (conflict) {
      alert("Horário já ocupado, escolha outro.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/salon/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: iso,
          clientName: customerName,
          customerName,
          phone: customerPhone,
          notes,
          serviceId: selectedServiceId,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        const refresh = await fetch(
          `/api/public/salon/appointments?start=${encodeURIComponent(new Date(selectedDate + "T00:00:00").toISOString())}&end=${encodeURIComponent(new Date(selectedDate + "T23:59:59").toISOString())}`,
        );
        if (refresh.ok) setAppointmentsOnDay(await refresh.json());
      } else {
        console.warn(await res.text());
        setSuccess(true);
      }
    } catch (err) {
      console.error(err);
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Carregando serviços...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.success}>
          <div className={styles.icon}>✅</div>
          <h2>Agendamento Recebido!</h2>
          <p>Entraremos em contato para confirmar seu horário.</p>
          <button className={styles.btn} onClick={() => setSuccess(false)}>
            Agendar outro horário
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>💇‍♀️ Agende seu Serviço</div>
        <div className={styles.tagline}>Escolha o serviço, selecione data e horário</div>
      </header>

      <main className={styles.content}>
        {data?.categories && data.categories.length > 0 && (
          <div className={styles.categories}>
            <button className={`${styles.categoryButton} ${!selectedCategory ? styles.categoryActive : ""}`} onClick={() => setSelectedCategory(null)}>
              Todos
            </button>
            {data.categories.map((cat) => (
              <button key={cat.id} className={`${styles.categoryButton} ${selectedCategory === cat.id ? styles.categoryActive : ""}`} onClick={() => setSelectedCategory(cat.id)}>
                {cat.name}
              </button>
            ))}
          </div>
        )}

        <section className={styles.productsList}>
          {services && services.length > 0 ? (
            services.map((s) => (
              <div key={s.id} className={styles.productCard} style={{ alignItems: "center" }}>
                <div className={styles.productImage}>
                  <div style={{ fontSize: 36 }}>✂️</div>
                </div>
                <div className={styles.productInfo}>
                  <h3 className={styles.productName}>{s.name}</h3>
                  {s.description && <p className={styles.productDescription}>{s.description}</p>}
                  <div className={styles.productFooter}>
                    <span className={styles.productPrice}>
                      {s.price !== undefined ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(s.price) : ""}
                    </span>
                    <button
                      className={styles.addButton}
                      onClick={() => setSelectedServiceId(s.id)}
                    >
                      {selectedServiceId === s.id ? "✓ Selecionado" : "+ Selecionar"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>Nenhum serviço disponível.</div>
          )}
        </section>

        {/* Agendamento abaixo dos serviços */}
        <section style={{ marginTop: 20, borderTop: "1px solid #eee", paddingTop: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <h4 style={{ margin: 0 }}>Agendamento</h4>
            <small style={{ color: "#666" }}>Escolha data e um horário disponível</small>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}>
              {baseSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 8 }}>
            <strong>Horários</strong>
            {checking ? (
              <div style={{ marginTop: 8 }}>Carregando horários...</div>
            ) : (
              <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {baseSlots.map((slot) => {
                  const ok = availability[slot];
                  const selected = slot === selectedTime;
                  return (
                    <button
                      key={slot}
                      onClick={() => handleSelectSlot(slot)}
                      disabled={!ok}
                      style={{
                        padding: "8px",
                        borderRadius: 6,
                        border: selected ? "2px solid #0066cc" : "1px solid #eee",
                        background: !ok ? "#f8d7da" : selected ? "#e6f0ff" : "#fff",
                        cursor: !ok ? "not-allowed" : "pointer",
                      }}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 8 }}>
              <label>Seu Nome *</label>
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 4 }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>WhatsApp</label>
              <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 4 }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Observações</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: "100%", padding: 8, marginTop: 4 }} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className={styles.btn} onClick={handleSubmit} disabled={submitting || !availability[selectedTime]}>
                {submitting ? "Agendando..." : "Confirmar Agendamento"}
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>Salão | Gestão ERP</footer>
    </div>
  );
}