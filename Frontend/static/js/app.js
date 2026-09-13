function showEl(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.classList.remove("hidden");
}

function hideEl(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add("hidden");
  el.textContent = "";
}

function statusBadge(status) {
  const map = {
    Open: "status-open",
    "In Progress": "status-in-progress",
    Closed: "status-closed",
  };
  const cls = map[status] || "status-open";
  return `<span class="status-badge ${cls}">${status}</span>`;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleString();
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    data = null;
  }
  if (!res.ok) {
    const detail = data && data.detail ? data.detail : "Request failed";
    const message = typeof detail === "string" ? detail : JSON.stringify(detail);
    throw new Error(message);
  }
  return data;
}

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

async function loadTickets() {
  const body = document.getElementById("tickets-body");
  const search = document.getElementById("search")?.value?.trim() || "";
  const status = document.getElementById("status-filter")?.value || "";

  hideEl("error");
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  const qs = params.toString() ? `?${params.toString()}` : "";

  try {
    const tickets = await api(`/api/tickets${qs}`);
    if (!tickets.length) {
      body.innerHTML =
        '<tr><td colspan="5" class="px-4 py-8 text-center text-slate-500">No tickets found.</td></tr>';
      return;
    }
    body.innerHTML = tickets
      .map(
        (t) => `
      <tr class="hover:bg-slate-50">
        <td class="px-4 py-3">
          <a class="text-slate-800 font-medium hover:underline" href="/tickets/${encodeURIComponent(t.ticket_id)}">${t.ticket_id}</a>
        </td>
        <td class="px-4 py-3">${escapeHtml(t.customer_name)}</td>
        <td class="px-4 py-3">${escapeHtml(t.subject)}</td>
        <td class="px-4 py-3">${statusBadge(t.status)}</td>
        <td class="px-4 py-3 whitespace-nowrap">${formatDate(t.created_at)}</td>
      </tr>`
      )
      .join("");
  } catch (err) {
    body.innerHTML =
      '<tr><td colspan="5" class="px-4 py-8 text-center text-slate-500">Unable to load tickets.</td></tr>';
    showEl("error", err.message);
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function initTicketList() {
  const search = document.getElementById("search");
  const filter = document.getElementById("status-filter");
  const debounced = debounce(loadTickets, 250);
  search?.addEventListener("input", debounced);
  filter?.addEventListener("change", loadTickets);
  loadTickets();
}

function initCreateForm() {
  const form = document.getElementById("create-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideEl("error");
    hideEl("success");

    const payload = {
      customer_name: document.getElementById("customer_name").value.trim(),
      customer_email: document.getElementById("customer_email").value.trim(),
      subject: document.getElementById("subject").value.trim(),
      description: document.getElementById("description").value.trim(),
    };

    try {
      const created = await api("/api/tickets", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showEl("success", `Ticket ${created.ticket_id} created. Redirecting...`);
      setTimeout(() => {
        window.location.href = `/tickets/${encodeURIComponent(created.ticket_id)}`;
      }, 700);
    } catch (err) {
      showEl("error", err.message);
    }
  });
}

function renderTicketDetail(ticket) {
  const container = document.getElementById("ticket-detail");
  const heading = document.getElementById("ticket-heading");
  if (heading) heading.textContent = `${ticket.ticket_id} — ${ticket.subject}`;

  container.innerHTML = `
    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
      <div>
        <dt class="text-slate-500">Ticket ID</dt>
        <dd class="font-medium mt-1">${escapeHtml(ticket.ticket_id)}</dd>
      </div>
      <div>
        <dt class="text-slate-500">Status</dt>
        <dd class="mt-1">${statusBadge(ticket.status)}</dd>
      </div>
      <div>
        <dt class="text-slate-500">Customer name</dt>
        <dd class="font-medium mt-1">${escapeHtml(ticket.customer_name)}</dd>
      </div>
      <div>
        <dt class="text-slate-500">Customer email</dt>
        <dd class="font-medium mt-1">${escapeHtml(ticket.customer_email)}</dd>
      </div>
      <div class="sm:col-span-2">
        <dt class="text-slate-500">Subject</dt>
        <dd class="font-medium mt-1">${escapeHtml(ticket.subject)}</dd>
      </div>
      <div class="sm:col-span-2">
        <dt class="text-slate-500">Description</dt>
        <dd class="mt-1 whitespace-pre-wrap">${escapeHtml(ticket.description)}</dd>
      </div>
      <div>
        <dt class="text-slate-500">Created</dt>
        <dd class="mt-1">${formatDate(ticket.created_at)}</dd>
      </div>
      <div>
        <dt class="text-slate-500">Updated</dt>
        <dd class="mt-1">${formatDate(ticket.updated_at)}</dd>
      </div>
    </dl>
  `;

  const statusSelect = document.getElementById("status");
  if (statusSelect) statusSelect.value = ticket.status;

  const notesList = document.getElementById("notes-list");
  if (!ticket.notes || !ticket.notes.length) {
    notesList.innerHTML = '<p class="text-slate-500">No notes yet.</p>';
  } else {
    notesList.innerHTML = ticket.notes
      .map(
        (n) => `
      <div class="border border-slate-100 rounded-md p-3 bg-slate-50">
        <p class="whitespace-pre-wrap text-slate-800">${escapeHtml(n.note_text)}</p>
        <p class="text-xs text-slate-500 mt-2">${formatDate(n.created_at)}</p>
      </div>`
      )
      .join("");
  }
}

function initTicketDetail(ticketId) {
  async function refresh() {
    hideEl("error");
    try {
      const ticket = await api(`/api/tickets/${encodeURIComponent(ticketId)}`);
      renderTicketDetail(ticket);
    } catch (err) {
      document.getElementById("ticket-detail").innerHTML =
        '<p class="text-red-600 text-sm">Unable to load ticket.</p>';
      document.getElementById("notes-list").innerHTML = "";
      showEl("error", err.message);
    }
  }

  const form = document.getElementById("update-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideEl("error");
    hideEl("success");

    const status = document.getElementById("status").value;
    const notes = document.getElementById("notes").value.trim();
    const payload = { status };
    if (notes) payload.notes = notes;

    try {
      await api(`/api/tickets/${encodeURIComponent(ticketId)}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      document.getElementById("notes").value = "";
      showEl("success", "Ticket updated.");
      await refresh();
    } catch (err) {
      showEl("error", err.message);
    }
  });

  refresh();
}
