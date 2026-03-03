import { useEffect, useMemo, useState } from "react";

const CSL_ID = 231;
const MENU_API_URL = "https://www.dongqiudi.com/api/v2/config/data_menu?mark=gif&platform=web&version=0&a=4";

function buildRoundKey(source) {
  const roundId = source?.round_id;
  const gameweek = source?.gameweek;
  if (roundId === undefined || gameweek === undefined) {
    return "";
  }
  return `${roundId}-${gameweek}`;
}

function dedupeMatches(matches) {
  const map = new Map();
  matches.forEach((match) => {
    if (!map.has(match.match_id)) {
      map.set(match.match_id, match);
    }
  });
  return Array.from(map.values());
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date);
}

function formatCountdown(targetDate) {
  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) {
    return "比赛进行中或已开始";
  }
  const minutes = Math.floor(diff / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  return `${days}天 ${hours}小时 ${mins}分钟`;
}

function parseApiUtcDateString(dateTimeText) {
  if (!dateTimeText || typeof dateTimeText !== "string") return null;
  const match = dateTimeText.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/
  );
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  const utcMs = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );
  // 数据源时间是 UTC，需要转成北京时间（UTC+8）
  return new Date(utcMs + 8 * 60 * 60 * 1000);
}

async function fetchJson(url) {
  if (window.desktopApi && typeof window.desktopApi.getJson === "function") {
    return window.desktopApi.getJson(url);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*"
    }
  });

  if (!response.ok) {
    throw new Error(`请求失败(${response.status})`);
  }
  return response.json();
}

async function loadScheduleMatches() {
  const menu = await fetchJson(MENU_API_URL);
  const list = menu?.data?.list?.data || [];
  const csl = list.find((entry) => Number(entry.id) === CSL_ID);
  if (!csl) {
    throw new Error("未找到中超配置");
  }

  const scheduleTab = csl.sub_tabs.find((tab) => tab.type === "schedule");
  if (!scheduleTab?.url) {
    throw new Error("未找到中超赛程入口");
  }

  const first = await fetchJson(scheduleTab.url);
  const rounds = first?.content?.rounds || [];
  const initialMatches = first?.content?.matches || [];

  const roundMap = new Map();
  rounds.forEach((round) => {
    const key = buildRoundKey(round.params);
    if (key) {
      roundMap.set(key, round.name || "未知轮次");
    }
  });

  const requests = rounds
    .map((round) => round.url)
    .filter(Boolean)
    .map((url) => fetchJson(url).catch(() => null));

  const results = await Promise.all(requests);
  const allMatches = [...initialMatches];
  results.forEach((res) => {
    if (res?.content?.matches?.length) {
      allMatches.push(...res.content.matches);
    }
  });

  return dedupeMatches(allMatches).map((match) => ({
    ...match,
    round_name: roundMap.get(buildRoundKey(match)) || "未知轮次"
  }));
}

function App() {
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState("正在加载中超赛程...");
  const [selectedTeam, setSelectedTeam] = useState("");

  const teams = useMemo(() => {
    const set = new Set();
    matches.forEach((match) => {
      if (match.team_A_name) set.add(match.team_A_name);
      if (match.team_B_name) set.add(match.team_B_name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }, [matches]);

  const nextMatch = useMemo(() => {
    if (!selectedTeam) return null;
    const now = Date.now();
    const future = matches
      .filter((match) => match.team_A_name === selectedTeam || match.team_B_name === selectedTeam)
      .map((match) => ({
        ...match,
        kickoffDate: parseApiUtcDateString(match.start_play)
      }))
      .filter((match) => match.kickoffDate && match.kickoffDate.getTime() >= now)
      .sort((a, b) => a.kickoffDate.getTime() - b.kickoffDate.getTime());
    return future[0] || null;
  }, [matches, selectedTeam]);

  async function refresh(manual = false) {
    try {
      setStatus(manual ? "正在刷新数据..." : "正在加载中超赛程...");
      const loaded = await loadScheduleMatches();
      setMatches(loaded);
      setStatus(`已加载 ${loaded.length} 场比赛，更新时间：${formatDateTime(new Date())}`);
    } catch (error) {
      setStatus(`加载失败：${error.message}`);
      setMatches([]);
    }
  }

  useEffect(() => {
    refresh(false);
  }, []);

  useEffect(() => {
    if (!teams.length) {
      setSelectedTeam("");
      return;
    }
    const favorite = localStorage.getItem("favoriteTeam");
    const initial = favorite && teams.includes(favorite) ? favorite : teams[0];
    setSelectedTeam((current) => (current && teams.includes(current) ? current : initial));
  }, [teams]);

  useEffect(() => {
    if (selectedTeam) {
      localStorage.setItem("favoriteTeam", selectedTeam);
    }
  }, [selectedTeam]);

  const rival = nextMatch
    ? nextMatch.team_A_name === selectedTeam
      ? nextMatch.team_B_name
      : nextMatch.team_A_name
    : "";
  const kickoff = nextMatch?.kickoffDate || null;
  const homeAway = nextMatch ? (nextMatch.team_A_name === selectedTeam ? "主场" : "客场") : "";

  return (
    <div className="container">
      <main className="main">
        <section className="section">
          <h2>球队选择</h2>
          <div className="field">
            <label htmlFor="teamSelect">我喜欢的球队</label>
            <select
              id="teamSelect"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              disabled={!teams.length}
            >
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => refresh(true)}>
              刷新赛程
            </button>
          </div>
          <div className="highlights">
            <div className="highlight-item">
              <span className="highlight-label">当前选择</span>
              <span className="highlight-value">{selectedTeam || "暂无"}</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-label">下一场对手</span>
              <span className="highlight-value">{rival || "暂无"}</span>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>最近比赛</h2>
          <div className="card">
            {!selectedTeam && <p className="placeholder">暂无球队数据。</p>}
            {selectedTeam && !nextMatch && (
              <p className="placeholder">本赛季后续暂无 {selectedTeam} 的未开赛比赛。</p>
            )}
            {selectedTeam && nextMatch && kickoff && (
              <>
                <div className="match-title">
                  {selectedTeam} vs {rival}
                </div>
                <div className="countdown">距离开赛：{formatCountdown(kickoff)}</div>
                <div className="meta">开赛时间：{formatDateTime(kickoff)}</div>
                <div className="meta">
                  轮次：{nextMatch.round_name} · {homeAway}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="section">
          <h2>数据状态</h2>
          <div className="status">{status}</div>
        </section>
      </main>
    </div>
  );
}

export default App;
