import Papa from 'papaparse';

export const loadData = async () => {
  return new Promise((resolve, reject) => {
    Papa.parse('/vgsales.csv', {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Data cleaning and augmentation
        const data = results.data
          .filter(row => row.Year && row.Year !== 'N/A' && row.Global_Sales)
          .map(row => {
            // Publisher tiers (simulated to determine AAA vs Indie)
            const aaaPublishers = ['Nintendo', 'Electronic Arts', 'Activision', 'Sony Computer Entertainment', 'Ubisoft', 'Take-Two Interactive', 'THQ', 'Konami Digital Entertainment', 'Sega', 'Namco Bandai Games', 'Microsoft Game Studios', 'Capcom', 'Atari', 'Warner Bros. Interactive Entertainment', 'Square Enix'];
            
            const isAAA = aaaPublishers.includes(row.Publisher);
            
            // Simulate Price based on AAA vs Indie
            const price = isAAA ? 59.99 : 19.99;
            
            // Calculate Revenue (Sales are in millions, so Global_Sales * Price)
            const revenue = row.Global_Sales * price;
            
            // Simulate Release Month (Random but weighted towards Holiday season)
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const isHoliday = Math.random() > 0.6; // 40% chance of holiday release
            const month = isHoliday ? months[Math.floor(Math.random() * 3) + 9] : months[Math.floor(Math.random() * 9)];
            
            return {
              ...row,
              Year: parseInt(row.Year),
              IsAAA: isAAA,
              DevType: isAAA ? 'Publisher-backed (AAA)' : 'Self-published/Indie',
              Price: price,
              Revenue: revenue,
              Month: month
            };
          });
        resolve(data);
      },
      error: (error) => reject(error)
    });
  });
};

// Helper: Calculate median
export const getMedian = (values) => {
  if (values.length === 0) return 0;
  values.sort((a, b) => a - b);
  const half = Math.floor(values.length / 2);
  if (values.length % 2) return values[half];
  return (values[half - 1] + values[half]) / 2.0;
};

// Process Market Overview
export const getMarketOverview = (data) => {
  const byYear = {};
  data.forEach(game => {
    if (!byYear[game.Year]) {
      byYear[game.Year] = { Year: game.Year, Sales: 0, Revenue: 0, Releases: 0, NA: 0, EU: 0, JP: 0, Other: 0 };
    }
    byYear[game.Year].Sales += game.Global_Sales;
    byYear[game.Year].Revenue += game.Revenue;
    byYear[game.Year].Releases += 1;
    byYear[game.Year].NA += game.NA_Sales || 0;
    byYear[game.Year].EU += game.EU_Sales || 0;
    byYear[game.Year].JP += game.JP_Sales || 0;
    byYear[game.Year].Other += game.Other_Sales || 0;
  });

  return Object.values(byYear)
    .filter(y => y.Year <= 2016) // Filter out futuristic erroneous data
    .sort((a, b) => a.Year - b.Year)
    .map(y => ({
      ...y,
      Sales: parseFloat(y.Sales.toFixed(2)),
      Revenue: parseFloat(y.Revenue.toFixed(2)),
      NA: parseFloat(y.NA.toFixed(2)),
      EU: parseFloat(y.EU.toFixed(2)),
      JP: parseFloat(y.JP.toFixed(2)),
      Other: parseFloat(y.Other.toFixed(2))
    }));
};

// Process Genre Analysis
export const getGenreAnalysis = (data) => {
  const byGenre = {};
  data.forEach(game => {
    if (!byGenre[game.Genre]) {
      byGenre[game.Genre] = { Genre: game.Genre, TotalSales: 0, TotalRevenue: 0, Count: 0, SalesList: [], NA: 0, EU: 0, JP: 0 };
    }
    byGenre[game.Genre].TotalSales += game.Global_Sales;
    byGenre[game.Genre].TotalRevenue += game.Revenue;
    byGenre[game.Genre].Count += 1;
    byGenre[game.Genre].SalesList.push(game.Global_Sales);
    byGenre[game.Genre].NA += game.NA_Sales || 0;
    byGenre[game.Genre].EU += game.EU_Sales || 0;
    byGenre[game.Genre].JP += game.JP_Sales || 0;
  });

  return Object.values(byGenre).map(g => ({
    Genre: g.Genre,
    TotalSales: parseFloat(g.TotalSales.toFixed(2)),
    TotalRevenue: parseFloat(g.TotalRevenue.toFixed(2)),
    Count: g.Count,
    AverageSales: parseFloat((g.TotalSales / g.Count).toFixed(2)),
    MedianSales: parseFloat(getMedian(g.SalesList).toFixed(2)),
    NA: parseFloat(g.NA.toFixed(2)),
    EU: parseFloat(g.EU.toFixed(2)),
    JP: parseFloat(g.JP.toFixed(2)),
  })).sort((a, b) => b.TotalSales - a.TotalSales);
};

// Process Dev Type Analysis (Indie vs AAA)
export const getDevTypeAnalysis = (data) => {
  const byDev = {
    'Publisher-backed (AAA)': { Type: 'Publisher-backed (AAA)', Sales: 0, Revenue: 0, Count: 0, SalesList: [], Hits: 0 },
    'Self-published/Indie': { Type: 'Self-published/Indie', Sales: 0, Revenue: 0, Count: 0, SalesList: [], Hits: 0 }
  };

  data.forEach(game => {
    const dev = byDev[game.DevType];
    dev.Sales += game.Global_Sales;
    dev.Revenue += game.Revenue;
    dev.Count += 1;
    dev.SalesList.push(game.Global_Sales);
    // A hit is > 1 million for AAA, > 0.1 million for Indie
    if (game.IsAAA && game.Global_Sales > 1) dev.Hits += 1;
    if (!game.IsAAA && game.Global_Sales > 0.1) dev.Hits += 1;
  });

  return Object.values(byDev).map(d => ({
    ...d,
    Sales: parseFloat(d.Sales.toFixed(2)),
    Revenue: parseFloat(d.Revenue.toFixed(2)),
    AverageSales: parseFloat((d.Sales / d.Count).toFixed(2)),
    MedianSales: parseFloat(getMedian(d.SalesList).toFixed(2)),
    HitRate: parseFloat(((d.Hits / d.Count) * 100).toFixed(1))
  }));
};

// Process Platform
export const getPlatformAnalysis = (data) => {
  const byPlat = {};
  data.forEach(g => {
    if (!byPlat[g.Platform]) {
      byPlat[g.Platform] = { Platform: g.Platform, Sales: 0, Count: 0, Avg: 0 };
    }
    byPlat[g.Platform].Sales += g.Global_Sales;
    byPlat[g.Platform].Count += 1;
  });

  return Object.values(byPlat)
    .sort((a,b) => b.Sales - a.Sales)
    .slice(0, 15)
    .map(p => ({
      ...p,
      Sales: parseFloat(p.Sales.toFixed(2)),
      Avg: parseFloat((p.Sales / p.Count).toFixed(2))
    }));
};
