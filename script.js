const store = {
  appointments: [
    { id: crypto.randomUUID(), patient: "Arjun Sen", dept: "Cardiology", date: "2026-03-02", priority: "Urgent" },
    { id: crypto.randomUUID(), patient: "Mia Johnson", dept: "Neurology", date: "2026-03-02", priority: "Standard" }
  ],
  doctors: [
    { name: "Dr. Sofia Carter", specialty: "Cardiology", status: "Available" },
    { name: "Dr. Ethan Park", specialty: "Emergency", status: "Busy" },
    { name: "Dr. Maya Iyer", specialty: "Pediatrics", status: "Available" },
    { name: "Dr. Noah Lewis", specialty: "Orthopedics", status: "Busy" }
  ],
  beds: [
    { unit: "ICU", used: 18, total: 24 },
    { unit: "General Ward", used: 110, total: 160 },
    { unit: "Emergency", used: 25, total: 32 }
  ],
  records: [
    { name: "Leah Brown", diagnosis: "Hypertension", status: "Stable" },
    { name: "Rahul Das", diagnosis: "Post-Surgery Recovery", status: "Observation" },
    { name: "Grace Hall", diagnosis: "Respiratory Infection", status: "Critical" },
    { name: "Daniel Smith", diagnosis: "Fracture", status: "Discharge Planned" }
  ],
  alerts: [
    { title: "Emergency intake peak", details: "8 new emergency admissions in last 20 minutes", level: "high" },
    { title: "MRI room now available", details: "Radiology slot opened at 14:30", level: "low" },
    { title: "ICU occupancy threshold", details: "ICU occupancy crossed 75%", level: "medium" }
  ]
};

const refs = {
  appointmentsTable: document.getElementById("appointmentsTable"),
  doctorCards: document.getElementById("doctorCards"),
  bedBars: document.getElementById("bedBars"),
  recordList: document.getElementById("recordList"),
  alertFeed: document.getElementById("alertFeed"),
  appointmentForm: document.getElementById("appointmentForm"),
  recordSearch: document.getElementById("recordSearch"),
  statAppointments: document.getElementById("statAppointments"),
  statPatients: document.getElementById("statPatients"),
  statBeds: document.getElementById("statBeds"),
  statAlerts: document.getElementById("statAlerts"),
  briefModal: document.getElementById("briefModal"),
  briefText: document.getElementById("briefText")
};

function persist() {
  localStorage.setItem("mediflow_data", JSON.stringify(store));
}

function hydrate() {
  const raw = localStorage.getItem("mediflow_data");
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    Object.assign(store, parsed);
  } catch {
    // ignore corrupted local storage
  }
}

function priorityClass(priority) {
  return priority.toLowerCase();
}

function renderAppointments() {
  refs.appointmentsTable.innerHTML = store.appointments.map((a) => `
    <tr>
      <td>${a.patient}</td>
      <td>${a.dept}</td>
      <td>${a.date}</td>
      <td><span class="priority ${priorityClass(a.priority)}">${a.priority}</span></td>
      <td><button class="btn subtle" data-id="${a.id}">Remove</button></td>
    </tr>
  `).join("");

  refs.appointmentsTable.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      store.appointments = store.appointments.filter((a) => a.id !== btn.dataset.id);
      persist();
      paint();
    });
  });
}

function renderDoctors() {
  refs.doctorCards.innerHTML = store.doctors.map((d) => {
    const isAvailable = d.status === "Available";
    return `
      <article class="doctor-card">
        <h4>${d.name}</h4>
        <p>${d.specialty}</p>
        <span class="status">
          <span class="dot ${isAvailable ? "available" : "busy"}"></span>
          ${d.status}
        </span>
      </article>
    `;
  }).join("");
}

function renderBeds() {
  refs.bedBars.innerHTML = store.beds.map((b) => {
    const percent = Math.round((b.used / b.total) * 100);
    return `
      <div class="bar-row">
        <strong>${b.unit} (${b.used}/${b.total})</strong>
        <div class="bar-track"><div class="bar-fill" style="width: ${percent}%"></div></div>
      </div>
    `;
  }).join("");
}

function renderRecords(filter = "") {
  const term = filter.trim().toLowerCase();
  const visible = store.records.filter((r) => {
    if (!term) return true;
    return [r.name, r.diagnosis, r.status].some((v) => v.toLowerCase().includes(term));
  });

  refs.recordList.innerHTML = visible.map((r) => `
    <li class="record-item">
      <strong>${r.name}</strong>
      <small>${r.diagnosis} | ${r.status}</small>
    </li>
  `).join("") || `<li class="record-item">No records found</li>`;
}

function renderAlerts() {
  refs.alertFeed.innerHTML = store.alerts.map((a) => `
    <li class="alert-item ${a.level}">
      <strong>${a.title}</strong>
      <small>${a.details}</small>
    </li>
  `).join("");
}

function updateStats() {
  const bedPercent = Math.round(store.beds.reduce((acc, b) => acc + b.used, 0) / store.beds.reduce((acc, b) => acc + b.total, 0) * 100);
  refs.statAppointments.textContent = String(store.appointments.length);
  refs.statPatients.textContent = String(store.records.length + 42);
  refs.statBeds.textContent = String(bedPercent);
  refs.statAlerts.textContent = String(store.alerts.length);
}

function attachHandlers() {
  refs.appointmentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const patient = document.getElementById("patientName").value.trim();
    const dept = document.getElementById("department").value.trim();
    const date = document.getElementById("appointmentDate").value;
    const priority = document.getElementById("priority").value;

    if (!patient || !dept || !date) return;

    store.appointments.unshift({ id: crypto.randomUUID(), patient, dept, date, priority });
    persist();
    refs.appointmentForm.reset();
    paint();
  });

  refs.recordSearch.addEventListener("input", (e) => {
    renderRecords(e.target.value);
  });

  document.getElementById("themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("mediflow_theme", document.body.classList.contains("dark") ? "dark" : "light");
  });

  document.getElementById("openDemoModal").addEventListener("click", () => {
    const appointmentsToday = store.appointments.filter((a) => a.date === new Date().toISOString().slice(0, 10)).length;
    refs.briefText.textContent = `Current occupancy is ${refs.statBeds.textContent}%. We have ${store.alerts.length} active alerts and ${appointmentsToday} appointments scheduled for today. Priority focus: Emergency triage and ICU workflow balancing.`;
    refs.briefModal.classList.add("open");
    refs.briefModal.setAttribute("aria-hidden", "false");
  });

  document.getElementById("closeModal").addEventListener("click", () => {
    refs.briefModal.classList.remove("open");
    refs.briefModal.setAttribute("aria-hidden", "true");
  });

  refs.briefModal.addEventListener("click", (e) => {
    if (e.target === refs.briefModal) {
      refs.briefModal.classList.remove("open");
      refs.briefModal.setAttribute("aria-hidden", "true");
    }
  });

  document.getElementById("seedData").addEventListener("click", () => {
    store.records.push({ name: "Nina Patel", diagnosis: "Diabetes", status: "Monitoring" });
    store.alerts.unshift({ title: "Lab report backlog", details: "Pathology queue increased by 14 requests", level: "medium" });
    persist();
    paint();
  });

  document.querySelectorAll(".quick-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".quick-link").forEach((el) => el.classList.remove("active"));
      btn.classList.add("active");
      const target = document.getElementById(btn.dataset.target);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function setupReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("show");
    });
  }, { threshold: 0.15 });

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

function loadTheme() {
  const current = localStorage.getItem("mediflow_theme");
  if (current === "dark") document.body.classList.add("dark");
}

function paint() {
  renderAppointments();
  renderDoctors();
  renderBeds();
  renderRecords(refs.recordSearch.value || "");
  renderAlerts();
  updateStats();
}

hydrate();
loadTheme();
paint();
attachHandlers();
setupReveal();
