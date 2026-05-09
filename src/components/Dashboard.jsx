import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter, ZAxis, Cell, ComposedChart
} from 'recharts';
import { 
  TrendingUp, BarChart2, Gamepad2, Globe, DollarSign, Activity, 
  Target, Download, Calendar, Layers, Zap, Search, Settings
} from 'lucide-react';
import { 
  loadData, getMarketOverview, getGenreAnalysis, getDevTypeAnalysis, getPlatformAnalysis 
} from '../utils/dataProcessing';

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Filters
  const [filterYear, setFilterYear] = useState('All');
  const [filterGenre, setFilterGenre] = useState('All');

  // Simulator State
  const [simGenre, setSimGenre] = useState('Action');
  const [simPlatform, setSimPlatform] = useState('PC');
  const [simBudget, setSimBudget] = useState('Indie');

  // Comparator State
  const [compSearch, setCompSearch] = useState('');

  useEffect(() => {
    loadData().then(parsed => {
      setData(parsed);
      setLoading(false);
    });
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(d => {
      if (filterYear !== 'All' && d.Year.toString() !== filterYear) return false;
      if (filterGenre !== 'All' && d.Genre !== filterGenre) return false;
      return true;
    });
  }, [data, filterYear, filterGenre]);

  const marketData = useMemo(() => getMarketOverview(filteredData), [filteredData]);
  const genreData = useMemo(() => getGenreAnalysis(filteredData), [filteredData]);
  const devData = useMemo(() => getDevTypeAnalysis(filteredData), [filteredData]);
  const platformData = useMemo(() => getPlatformAnalysis(filteredData), [filteredData]);

  // Seasonality Data
  const seasonalityData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const byMonth = {};
    months.forEach(m => byMonth[m] = { Month: m, Sales: 0, Count: 0 });
    
    filteredData.forEach(g => {
      if(byMonth[g.Month]) {
        byMonth[g.Month].Sales += g.Global_Sales;
        byMonth[g.Month].Count += 1;
      }
    });
    
    return months.map(m => ({
      Month: m,
      Sales: parseFloat(byMonth[m].Sales.toFixed(2)),
      AvgSales: byMonth[m].Count ? parseFloat((byMonth[m].Sales / byMonth[m].Count).toFixed(2)) : 0
    }));
  }, [filteredData]);

  const years = useMemo(() => [...new Set(data.map(d => d.Year))].sort().filter(y => y <= 2016), [data]);
  const genres = useMemo(() => [...new Set(data.map(d => d.Genre))].sort(), [data]);
  const platforms = useMemo(() => [...new Set(data.map(d => d.Platform))].sort(), [data]);

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 600 }}>Analyzing Market Data...</h2>
      </div>
    );
  }

  const renderOverview = () => (
    <>
      <div className="grid-3">
        <div className="glass-card">
          <div className="card-title"><DollarSign size={20} /> Total Industry Revenue</div>
          <div className="stat-value">${(marketData.reduce((acc, curr) => acc + curr.Revenue, 0) / 1000).toFixed(2)}B</div>
          <div className="stat-trend trend-up"><TrendingUp size={16}/> Simulated lifetime revenue</div>
        </div>
        <div className="glass-card">
          <div className="card-title"><Activity size={20} /> Total Units Sold</div>
          <div className="stat-value">{(marketData.reduce((acc, curr) => acc + curr.Sales, 0)).toFixed(0)}M</div>
          <div className="stat-label">Global Game Copies</div>
        </div>
        <div className="glass-card">
          <div className="card-title"><Gamepad2 size={20} /> Total Games Released</div>
          <div className="stat-value">{filteredData.length.toLocaleString()}</div>
          <div className="stat-label">Titles evaluated</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="glass-card">
          <div className="card-title">Industry Revenue Trends</div>
          <div className="chart-container">
            <ResponsiveContainer>
              <AreaChart data={marketData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="Year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{background: '#1e293b', border: 'none', borderRadius: '8px'}} />
                <Area type="monotone" dataKey="Revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="glass-card">
          <div className="card-title">Regional Revenue Share</div>
          <div className="chart-container">
            <ResponsiveContainer>
              <BarChart data={marketData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="Year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{background: '#1e293b', border: 'none', borderRadius: '8px'}} />
                <Legend />
                <Bar dataKey="NA" stackId="a" fill="#3b82f6" />
                <Bar dataKey="EU" stackId="a" fill="#8b5cf6" />
                <Bar dataKey="JP" stackId="a" fill="#10b981" />
                <Bar dataKey="Other" stackId="a" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );

  const renderGenreAnalysis = () => (
    <>
      <div className="glass-card">
        <div className="card-title">Genre Profitability & Saturation Matrix</div>
        <p style={{color: '#94a3b8', marginBottom: '1rem'}}>
          Evaluates market saturation (Games Released) against Total Revenue. Top right quadrant represents high revenue, highly competitive genres.
        </p>
        <div className="chart-container" style={{height: '400px'}}>
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="Count" name="Games Released" stroke="#94a3b8" />
              <YAxis dataKey="TotalRevenue" name="Revenue ($M)" stroke="#94a3b8" />
              <ZAxis dataKey="AverageSales" range={[100, 1000]} name="Avg Sales (M)" />
              <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{background: '#1e293b', border: 'none', borderRadius: '8px'}} />
              <Legend />
              <Scatter name="Genres" data={genreData} fill="#8b5cf6">
                {genreData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#8b5cf6'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        <div className="glass-card">
          <div className="card-title">Average vs Median Sales per Genre</div>
          <div className="chart-container">
            <ResponsiveContainer>
              <BarChart data={genreData.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="Genre" type="category" stroke="#94a3b8" width={100} />
                <Tooltip contentStyle={{background: '#1e293b', border: 'none', borderRadius: '8px'}} />
                <Legend />
                <Bar dataKey="AverageSales" fill="#3b82f6" name="Average Sales (M)" />
                <Bar dataKey="MedianSales" fill="#f59e0b" name="Median Sales (M)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="glass-card" style={{overflowY: 'auto', maxHeight: '450px'}}>
          <div className="card-title">Opportunity Finder</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Genre</th>
                <th>Revenue Potential</th>
                <th>Competition</th>
                <th>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {genreData.map((g, i) => {
                const isUnderserved = g.AverageSales > 0.5 && g.Count < 500;
                const isSaturated = g.Count > 1000;
                return (
                  <tr key={i}>
                    <td style={{fontWeight: 600}}>{g.Genre}</td>
                    <td>${g.TotalRevenue.toFixed(0)}M</td>
                    <td>{g.Count} titles</td>
                    <td>
                      {isUnderserved ? <span className="badge badge-success">High Opp</span> : 
                       isSaturated ? <span className="badge badge-warning">Saturated</span> : 
                       <span className="badge" style={{background: 'rgba(255,255,255,0.1)'}}>Neutral</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderIndieVsAAA = () => (
    <>
      <div className="grid-2">
        {devData.map((d, i) => (
          <div className="glass-card" key={i}>
            <div className="card-title">
              {d.Type === 'Publisher-backed (AAA)' ? <Layers size={20}/> : <Target size={20}/>}
              {d.Type}
            </div>
            <div className="stat-value">{d.HitRate}%</div>
            <div className="stat-label">Hit Rate Probability</div>
            <div style={{marginTop: '1rem', color: '#94a3b8', fontSize: '0.875rem'}}>
              Median Sales: <span style={{color: '#fff'}}>{d.MedianSales}M units</span><br/>
              Average Sales: <span style={{color: '#fff'}}>{d.AverageSales}M units</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="glass-card">
          <div className="card-title">Platform Viability</div>
          <div className="chart-container">
            <ResponsiveContainer>
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="Platform" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{background: '#1e293b', border: 'none', borderRadius: '8px'}} />
                <Bar dataKey="Sales" fill="#10b981" name="Total Platform Sales (M)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <div className="card-title">Seasonality & Launch Window Impact</div>
          <p style={{color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem'}}>
            (Simulated) Sales performance correlated to launch month. Notice the spike around Q4 Holiday season.
          </p>
          <div className="chart-container" style={{height: '280px'}}>
            <ResponsiveContainer>
              <ComposedChart data={seasonalityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="Month" stroke="#94a3b8" />
                <YAxis yAxisId="left" stroke="#3b82f6" />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" />
                <Tooltip contentStyle={{background: '#1e293b', border: 'none', borderRadius: '8px'}} />
                <Legend />
                <Bar yAxisId="left" dataKey="Sales" fill="#3b82f6" name="Total Sales (M)" />
                <Line yAxisId="right" type="monotone" dataKey="AvgSales" stroke="#f59e0b" name="Avg Sales per Game (M)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );

  const renderAdvanced = () => {
    // Simulator calculations based on historical data subset
    const simDataMatch = data.filter(d => 
      d.Genre === simGenre && 
      d.Platform === simPlatform && 
      (simBudget === 'Indie' ? !d.IsAAA : d.IsAAA)
    );
    
    const simAvg = simDataMatch.length > 0 ? (simDataMatch.reduce((acc, curr) => acc + curr.Global_Sales, 0) / simDataMatch.length).toFixed(2) : 'N/A';
    const simMedian = simDataMatch.length > 0 ? [...simDataMatch].sort((a,b)=>a.Global_Sales-b.Global_Sales)[Math.floor(simDataMatch.length/2)].Global_Sales : 'N/A';
    const simCount = simDataMatch.length;

    // Comparator filtering
    const compResults = compSearch.length > 2 
      ? data.filter(d => d.Name && String(d.Name).toLowerCase().includes(compSearch.toLowerCase())).slice(0, 10)
      : [];

    return (
      <div className="grid-2">
        <div className="glass-card">
          <div className="card-title"><Zap size={20} /> Success Benchmark Simulator</div>
          <p style={{color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem'}}>
            Simulate expected sales range based on historical analogues.
          </p>
          
          <div className="input-group">
            <label className="input-label">Target Genre</label>
            <select className="select-control" value={simGenre} onChange={e => setSimGenre(e.target.value)}>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          
          <div className="input-group">
            <label className="input-label">Target Platform</label>
            <select className="select-control" value={simPlatform} onChange={e => setSimPlatform(e.target.value)}>
              {platforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Budget Level</label>
            <select className="select-control" value={simBudget} onChange={e => setSimBudget(e.target.value)}>
              <option value="Indie">Indie / Self-Published</option>
              <option value="AAA">AAA / Publisher-Backed</option>
            </select>
          </div>

          <div style={{marginTop: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)'}}>
            <h4 style={{marginBottom: '1rem', color: '#60a5fa'}}>Simulation Results ({simCount} analogues found)</h4>
            {simCount > 0 ? (
              <>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                  <span style={{color: '#94a3b8'}}>Expected Median Sales:</span>
                  <strong style={{color: '#f59e0b'}}>{simMedian}M units</strong>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                  <span style={{color: '#94a3b8'}}>Optimistic (Average):</span>
                  <strong style={{color: '#10b981'}}>{simAvg}M units</strong>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <span style={{color: '#94a3b8'}}>Estimated Revenue Range:</span>
                  <strong style={{color: '#fff'}}>${(simMedian * (simBudget === 'AAA' ? 60 : 20)).toFixed(1)}M - ${(simAvg * (simBudget === 'AAA' ? 60 : 20)).toFixed(1)}M</strong>
                </div>
              </>
            ) : (
              <p style={{color: '#ef4444'}}>Not enough historical data for this combination to simulate.</p>
            )}
          </div>
        </div>

        <div className="glass-card">
          <div className="card-title"><Search size={20} /> Game Comparator Tool</div>
          <p style={{color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem'}}>
            Search for specific games to view their benchmarks.
          </p>
          
          <div className="input-group">
            <input 
              type="text" 
              className="input-control" 
              placeholder="Search game title (e.g. 'Halo', 'Zelda')..." 
              value={compSearch}
              onChange={e => setCompSearch(e.target.value)}
            />
          </div>

          <div style={{marginTop: '1.5rem', overflowY: 'auto', maxHeight: '350px'}}>
            {compResults.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Platform</th>
                    <th>Year</th>
                    <th>Global Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {compResults.map((g, i) => (
                    <tr key={i}>
                      <td style={{fontWeight: 500, color: '#e2e8f0'}}>{g.Name}</td>
                      <td><span className="badge" style={{background: 'rgba(59, 130, 246, 0.2)'}}>{g.Platform}</span></td>
                      <td>{g.Year}</td>
                      <td style={{color: '#10b981'}}>{g.Global_Sales}M</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : compSearch.length > 2 ? (
              <p style={{color: '#94a3b8', textAlign: 'center', marginTop: '2rem'}}>No games found matching "{compSearch}"</p>
            ) : (
              <p style={{color: '#94a3b8', textAlign: 'center', marginTop: '2rem'}}>Type at least 3 characters to search.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <div className="header">
        <div>
          <h1 className="header-title">Nexus BI</h1>
          <div className="header-subtitle">Strategic Game Development Decision Support System</div>
        </div>
        <div style={{display: 'flex', gap: '1rem'}}>
          <div className="input-group">
            <select className="select-control" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
              <option value="All">All Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="input-group">
            <select className="select-control" value={filterGenre} onChange={e => setFilterGenre(e.target.value)}>
              <option value="All">All Genres</option>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" style={{alignSelf: 'flex-start'}} onClick={() => alert('Generating PDF Investor Report...')}>
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      <div className="nav-tabs">
        <button className={`btn ${activeTab === 'overview' ? 'btn-active' : ''}`} onClick={() => setActiveTab('overview')}>
          <Globe size={18} /> Market Overview
        </button>
        <button className={`btn ${activeTab === 'genre' ? 'btn-active' : ''}`} onClick={() => setActiveTab('genre')}>
          <BarChart2 size={18} /> Genre Analysis
        </button>
        <button className={`btn ${activeTab === 'indie' ? 'btn-active' : ''}`} onClick={() => setActiveTab('indie')}>
          <Target size={18} /> Studio Viability
        </button>
        <button className={`btn ${activeTab === 'advanced' ? 'btn-active' : ''}`} onClick={() => setActiveTab('advanced')}>
          <Settings size={18} /> Advanced Tools
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'genre' && renderGenreAnalysis()}
        {activeTab === 'indie' && renderIndieVsAAA()}
        {activeTab === 'advanced' && renderAdvanced()}
      </div>
    </div>
  );
}
