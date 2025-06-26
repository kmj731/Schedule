// 공연 정보
const musicalInfo = {
  "2024_aladin.csv": {
    title: "알라딘",
    location: "샤롯데씨어터",
    period: "2024.11.22 ~ 2025.06.22",
    image: "https://www.aladdinthemusical.co.kr/Contents/Images/logo.png"
  },
  "2025_aladin_busan.csv": {
    title: "알라딘 부산",
    location: "드림씨어터",
    period: "2025.07.01 ~ 2025.10.01",
    image: "https://www.aladdinthemusical.co.kr/Contents/Images/logo.png"
  }
};

// 캐스팅 정보
const castByMusical = {
  "2025_aladin_busan.csv": [
    "김준수", "서경수", "박강현", "정성화", "정원영",
    "강홍석", "이성경", "민경아", "최지혜", "이상준",
    "황만익", "윤선용", "임별", "방보용", "양병철"
  ],
  "2024_aladin.csv": [
    "김준수", "서경수", "박강현", "정성화", "정원영",
    "강홍석", "이성경", "민경아", "최지혜", "이상준",
    "황만익", "윤선용", "임별", "방보용", "양병철"
  ],
};

// 예매 정보
const bookingLinksByMusical = {
  "2024_aladin.csv": [
    { text: "인터파크", href: "https://tickets.interpark.com/goods/24012498" },
    { text: "예스24", href: "http://ticket.yes24.com/Perf/50841" },
    { text: "샤롯데씨어터", href: "https://www.charlottetheater.co.kr/performence/current.asp" },
    { text: "뮤직오브더나잇", href: "https://www.aladdinthemusical.co.kr" }
  ],
  "2025_aladin_busan.csv": [
    { text: "인터파크", href: "https://tickets.interpark.com/goods/25005672" },
    { text: "예스24", href: "http://ticket.yes24.com/Perf/53547" },
    { text: "뮤직오브더나잇", href: "https://www.aladdinthemusical.co.kr" }
  ]
};

function updateMusicalInfo(fileName) {
  const info = musicalInfo[fileName];
  if (!info) return;

  document.getElementById("musicalTitle").textContent = info.title;
  document.getElementById("musicalLogo").src = info.image;
  document.getElementById("musicalInfo").innerHTML =
    `🚩장소 : ${info.location}<br/>📅공연기간 : ${info.period}`;
}

function updateCastButtons(fileName) {
  const castList = castByMusical[fileName] || [];
  const panel = document.getElementById("filter-cast");
  panel.innerHTML = "";

  castList.forEach(name => {
    const btn = document.createElement("button");
    btn.textContent = name;
    btn.className = "cast-btn";

    btn.addEventListener("click", () => {
      if (filterState.casts.has(name)) {
        filterState.casts.delete(name);
        btn.classList.remove("active");
      } else {
        filterState.casts.add(name);
        btn.classList.add("active");
      }
      applyAllFilters(); // 필터 적용
    });

    panel.appendChild(btn);
  });
}

function updateBookingLinks(fileName) {
  const container = document.querySelector(".booking-container");
  const links = bookingLinksByMusical[fileName] || [];

  container.innerHTML = `
    <span style="font-size: 14px">🎟️ 예매하기</span>
    ${links.map(link => `
      <a href="${link.href}" target="_blank" class="booking-btn">
        ${link.text}
      </a>
    `).join("")}
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("scheduleTable");
  const saveButton = document.getElementById("saveButton");
  const filterButton = document.getElementById("filterButton");
  const showAllButton = document.getElementById("showAllButton");
  const musicalSelect = document.getElementById("musicalSelect");

  const filterState = {
    dateStart: null,
    dateEnd: null,
    weekdays: new Set(),
    times: new Set(),
    casts: new Set()
  };

  function toggleFilter(type) {
    document.querySelectorAll(".filter-panel").forEach((panel) => {
      panel.style.display = panel.id === `filter-${type}` ? (panel.style.display === "block" ? "none" : "block") : "none";
    });
  }
  window.toggleFilter = toggleFilter;

  window.applyDateFilter = function () {
    filterState.dateStart = document.getElementById("startDate").value;
    filterState.dateEnd = document.getElementById("endDate").value;
    applyAllFilters();
  };

  function applyAllFilters() {
    const rows = document.querySelectorAll("#scheduleTable tr");
    rows.forEach((row) => {
      const dateStr = row.getAttribute("data-date");
      const cells = row.querySelectorAll("td");
      const dateText = cells[1]?.textContent.trim();
      const timeText = cells[2]?.textContent.trim();
      const castings = [...cells].slice(3).map(td => td.textContent.trim());

      let passDate = true;
      if (filterState.dateStart && filterState.dateEnd) {
        const rowDate = new Date(dateStr);
        const start = new Date(filterState.dateStart);
        const end = new Date(filterState.dateEnd);
        passDate = rowDate >= start && rowDate <= end;
      }

      let passWeek = true;
      if (filterState.weekdays.size > 0) {
        const dayKor = dateText?.match(/\((.)\)/)?.[1];
        const map = { '월': '월요일', '화': '화요일', '수': '수요일', '목': '목요일', '금': '금요일', '토': '토요일', '일': '일요일' };
        passWeek = filterState.weekdays.has(map[dayKor]);
      }

      let passTime = filterState.times.size === 0 || filterState.times.has(timeText);
      let passCast = filterState.casts.size === 0 || castings.some(name => filterState.casts.has(name));

      row.style.display = (passDate && passWeek && passTime && passCast) ? "table-row" : "none";
    });
  }

  function attachRowEvents() {
    const rows = document.querySelectorAll("#scheduleTable tr");
    rows.forEach((row) => {
      const id = row.getAttribute("data-id");
      const isSelected = localStorage.getItem(`selected-row-${id}`) === "true";
      if (isSelected) row.classList.add("selected");
      row.addEventListener("click", () => row.classList.toggle("selected"));
    });
    applyAllFilters();
  }

  function loadSchedule(fileName) {
    tableBody.innerHTML = "";
    let currentYear = 2025;
    let prevMonth = null;

    Papa.parse(`/Schedule/data/${fileName}`, {
      download: true,
      header: true,
      complete: function (results) {
        const data = results.data;
        data.forEach((item) => {
          const month = parseInt(item.date.split("/")[0]);
          const day = parseInt(item.date.split("/")[1].split("(")[0]);

          if (prevMonth !== null && month < prevMonth) currentYear++;
          prevMonth = month;

          const fullDate = `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

          const row = document.createElement("tr");
          row.setAttribute("data-id", item.id);
          row.setAttribute("data-date", fullDate);

          const dateClass = item.date.includes("(일)") ? "redday" : item.date.includes("(토)") ? "blueday" : "";

          row.innerHTML = `
            <td class="special">${item.special || ""}</td>
            <td class="${dateClass}">${item.date}</td>
            <td>${item.time}</td>
            <td>${item["알라딘"]}</td>
            <td>${item["지니"]}</td>
            <td>${item["자스민"]}</td>
            <td>${item["술탄"]}</td>
            <td>${item["자파"]}</td>
            <td>${item["밥칵"]}</td>
          `;
          tableBody.appendChild(row);
        });
        attachRowEvents();
      }
    });
  }

    musicalSelect.addEventListener("change", (e) => {
        const file = e.target.value;
        loadSchedule(file);
        updateMusicalInfo(file);
        updateCastButtons(file);
        updateBookingLinks(file);
    });

    const initialFile = musicalSelect.value;
    loadSchedule(initialFile);
    updateMusicalInfo(initialFile);
    updateCastButtons(initialFile);
    updateBookingLinks(initialFile);

  saveButton?.addEventListener("click", () => {
    document.querySelectorAll("#scheduleTable tr").forEach((row) => {
      const id = row.getAttribute("data-id");
      const isSelected = row.classList.contains("selected");
      localStorage.setItem(`selected-row-${id}`, isSelected);
    });
    alert("선택한 공연이 저장되었습니다! ✅");
  });

  filterButton?.addEventListener("click", () => {
    const rows = document.querySelectorAll("#scheduleTable tr");
    const isFiltering = filterButton.dataset.filtering === "true";
    filterButton.dataset.filtering = (!isFiltering).toString();
    rows.forEach((row) => {
      row.style.visibility = !isFiltering && !row.classList.contains("selected") ? "collapse" : "visible";
    });
    filterButton.textContent = !isFiltering ? "전체 일정 보기" : "내 관극 일정 보기";
  });

  showAllButton?.addEventListener("click", () => {
    document.querySelectorAll("#scheduleTable tr").forEach((row) => {
      row.style.display = "table-row";
      row.style.visibility = "visible";
    });
  });

  // 필터 버튼 설정
  [".day-btn", ".time-btn", ".cast-btn"].forEach(selector => {
    document.querySelectorAll(selector).forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.textContent.trim();
        const key = selector === ".day-btn" ? "weekdays" : selector === ".time-btn" ? "times" : "casts";
        if (filterState[key].has(val)) {
          filterState[key].delete(val);
          btn.classList.remove("active");
        } else {
          filterState[key].add(val);
          btn.classList.add("active");
        }
        applyAllFilters();
      });
    });
  });

  document.getElementById("resetFilters")?.addEventListener("click", () => {
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
    filterState.dateStart = null;
    filterState.dateEnd = null;
    filterState.weekdays.clear();
    filterState.times.clear();
    filterState.casts.clear();

    document.querySelectorAll(".day-btn, .time-btn, .cast-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    applyAllFilters();
  });

  // 필터 메뉴 외부 클릭 시 닫기
  document.addEventListener("click", (e) => {
    const isFilterBtn = e.target.closest(".filter-group");
    if (!isFilterBtn) {
      document.querySelectorAll(".filter-panel").forEach(panel => panel.style.display = "none");
    }
  });
});
