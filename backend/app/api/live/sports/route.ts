interface EspnCompetitor { homeAway: string; score?: string; team: { displayName: string; shortDisplayName?: string } }
interface EspnCompetition { competitors: EspnCompetitor[]; venue?: { fullName?: string; displayName?: string } }
interface EspnEvent {
  id: string; date: string; name: string;
  competitions: EspnCompetition[];
  status: { type: { state: string; shortDetail?: string; detail?: string }; summary?: string; displayClock?: string };
}
interface EspnResponse { events?: EspnEvent[]; leagues?: Array<{ abbreviation?: string; name?: string }> }

const footballLeagues = [
  { slug: 'ind.1', label: 'ISL' },
  { slug: 'eng.1', label: 'EPL' },
  { slug: 'esp.1', label: 'La Liga' },
];

async function espn(path: string) {
  try {
    const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    return (await response.json()) as EspnResponse;
  } catch { return null; }
}

export async function GET() {
  try {
    const [cricketData, ...footballData] = await Promise.all([
      espn('cricket/8048'),
      ...footballLeagues.map((league) => espn(`soccer/${league.slug}`)),
    ]);
    const cricketEvent = cricketData?.events?.[0];
    const cricketCompetition = cricketEvent?.competitions?.[0];
    const cricket = cricketEvent && cricketCompetition ? {
      id: cricketEvent.id,
      title: cricketEvent.name,
      date: cricketEvent.date,
      status: cricketEvent.status.type.shortDetail ?? cricketEvent.status.type.detail ?? 'Scheduled',
      state: cricketEvent.status.type.state,
      summary: cricketEvent.status.summary ?? '',
      venue: cricketCompetition.venue?.fullName ?? '',
      teams: cricketCompetition.competitors.map((team) => ({ name: team.team.displayName, score: team.score ?? '—', homeAway: team.homeAway })),
    } : null;

    const football = footballData.flatMap((data, leagueIndex) => (data?.events ?? []).slice(0, 2).map((event) => {
      const competition = event.competitions[0];
      const home = competition?.competitors.find((team) => team.homeAway === 'home');
      const away = competition?.competitors.find((team) => team.homeAway === 'away');
      return {
        id: event.id,
        league: footballLeagues[leagueIndex].label,
        date: event.date,
        state: event.status.type.state,
        status: event.status.type.shortDetail ?? event.status.type.detail ?? 'Scheduled',
        home: home?.team.shortDisplayName ?? home?.team.displayName ?? 'TBD',
        away: away?.team.shortDisplayName ?? away?.team.displayName ?? 'TBD',
        homeScore: home?.score ?? '—',
        awayScore: away?.score ?? '—',
      };
    })).sort((a, b) => ({ in: 0, pre: 1, post: 2 }[a.state] ?? 3) - ({ in: 0, pre: 1, post: 2 }[b.state] ?? 3)).slice(0, 5);

    const available = Boolean(cricket || football.length);
    return Response.json({ cricket, football, available, error: available ? null : 'Sports provider did not respond in time', updatedAt: new Date().toISOString(), source: 'ESPN score feeds' });
  } catch {
    return Response.json({ cricket: null, football: [], available: false, error: 'Live sports data is temporarily unavailable', updatedAt: new Date().toISOString(), source: 'ESPN score feeds' });
  }
}
