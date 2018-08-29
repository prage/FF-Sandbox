// This file handles seasons and ranking
// Author: Mark Craig

// trophies required to rank up 
var rankTrophyList = 
[
	2,		// Rank 1 - meaning I need to have 2 trophies to be in rank 2
	4,		// Rank 2
	6,		// Rank 3
	8,		// Rank 4
	10,		// Rank 5
	12,		// Rank 6
	15,		// Rank 7
	18,		// Rank 8
	21,		// Rank 9
	24,		// Rank 10
	28,		// Rank 11
	32,		// Rank 12
	36,		// Rank 13
	40,		// Rank 14
	44,		// Rank 15
	48,		// Rank 16
	53,		// Rank 17
	58,		// Rank 18
	63,		// Rank 19
	68,		// Rank 20
	73,		// Rank 21
	78,		// Rank 22
	83,		// Rank 23
	88,		// Rank 24
	93		// Rank 25
];

var kTrophyLosingStartRank = 15;	// rank where we start to lose trophies
var kWinningStreakToWinTrophies = 3;	// how big a winning streak to have to win an extra trophy

// Return which rank a player is for a given number of trophies
// 1 is the lowest rank because rank 0 is superstar rank
function GetRankFromTrophies(trophies)
{
	var rankIndex;
	
	for(rankIndex=0;rankIndex<rankTrophyList.length;rankIndex++)
	{
		if(trophies < rankTrophyList[rankIndex])
		{
			return rankIndex + 1;
		}
	}
	return rankIndex + 1;	
}

// Given a number of trophies return how many are needed in TOTAL for the next rank
function GetTrophiesForNextRank(trophies)
{
	for(var rankIndex=0;rankIndex<rankTrophyList.length;rankIndex++)
	{
		if(trophies < rankTrophyList[rankIndex])
			return rankTrophyList[rankIndex];
	}
	return 0;
}

// Return how many MORE trophies are needed for the next rank
function GetTrophiesToNextRank(trophies)
{
	return GetTrophiesForNextRank(trophies) - trophies;
}

function ProcessRankedMatchResult(playerId, bWon, bDraw)
{
	// Get existing stats (trophies, rank, winning streak)
	var results={
		trophiesWon : 0,	// trophies won this time
		trophiesTotal : 0,
		trophiesToNextRank : 0,
		trophiesForCurrentRankPre :0,
		trophiesForNextRankPre :0,
		trophiesForNextRankPost:0,
		oldRank : 1,			
		winningStreak : 0,	
		currentWins: 0,
		currentLoses: 0,
		currentDraws: 0,
		lastSuperstar: 0,
		newSuperstar: 0,
		trophyList : rankTrophyList
	};
	// Get player stats
	var playerStats = server.GetPlayerStatistics( // >>>> Playfab Server Call <<<<
		{
			PlayFabId: playerId,
			StatisticNames: ["Trophies",
							"Rank",
							"WinningStreak", 
							"RankedMatchesWon", 
							"RankedMatchesLost", 
							"RankedMatchesDraw"],
		});
		
	for(var statNo=0;statNo < playerStats.Statistics.length;statNo++)
	{
		var stat = playerStats.Statistics[statNo];
		
		if(stat.StatisticName == "Trophies")
			results.trophiesTotal = stat.Value;
		else if(stat.StatisticName == "Rank")
			results.oldRank = stat.Value;
		else if(stat.StatisticName == "WinningStreak")
			results.winningStreak = stat.Value;
		else if(stat.StatisticName == "RankedMatchesWon")
			results.currentWins = stat.Value;
		else if(stat.StatisticName == "RankedMatchesLost")
			results.currentLoses = stat.Value;
		else if(stat.StatisticName == "RankedMatchesDraw")
			results.currentDraws = stat.Value;
		
	}
	var bLost = false;
	// if we have won
	if(bWon)
	{
		results.trophiesWon++;	// 1 trophy for victory
		results.currentWins++;
		
		// winning streak - only available below top 5 ranks
		if(results.oldRank < rankTrophyList.length - 5)
		{
			results.winningStreak++;
			if(results.winningStreak > kWinningStreakToWinTrophies)
			{
				results.trophiesWon++;	// another trophy for winning streak
			}
		}
		else
		{
			results.winningStreak = 0;	// no winning streak in top 5
		}
	}
	else if(bDraw)
	{
		results.currentDraws++;
	}
	else	// lost
	{
		if(results.oldRank >= kTrophyLosingStartRank && results.oldRank != 0 && results.trophiesTotal > 0)	// lose trophies when we are rank 5 and better (but not superstar)
		{
			results.trophiesWon--;
		}
		results.currentLoses++;
		bLost=true;
		results.winningStreak = 0;	// cancel winning streak
	}
	

	
	results.trophiesTotal += results.trophiesWon;
	if(results.oldRank == 26)	// if we are a superstar rank then we are locked there
		results.newRank = 26;
	else
		results.newRank = GetRankFromTrophies(results.trophiesTotal );
	
	
	
	results.trophiesForCurrentRankPre = 0;
	results.trophiesForNextRankPre = 0;	
	if(results.oldRank > 1)
		results.trophiesForCurrentRankPre = rankTrophyList[results.oldRank - 2];
	if(results.oldRank > 0)
		results.trophiesForNextRankPre = rankTrophyList[results.oldRank - 1];	
	results.trophiesForNextRankPost = GetTrophiesForNextRank(results.trophiesTotal);
	results.trophiesToNextRank = GetTrophiesToNextRank(results.trophiesTotal);
	
	
	
	
		
	// have we ranked up?
	if(results.newRank > results.oldRank)
	{
		if(results.newRank == rankTrophyList.length + 1)	// we have moved to final rank
		{		
			results.newRank = 26;
		}
	}
	
	//RANKED GAMES ONLY
	server.UpdatePlayerStatistics( // >>>> Playfab Server Call <<<<
		{
		PlayFabId: playerId,
		Statistics: [
			{StatisticName: "Trophies", 		Value: results.trophiesTotal},
			{StatisticName: "Rank", 			Value: results.newRank},
			{StatisticName: "WinningStreak", 	Value: results.winningStreak},
			{StatisticName: "RankedMatchesWon", Value:  bWon ? 1:0},
			{StatisticName: "RankedMatchesLost",Value:  bLost ? 0:1},
			{StatisticName: "RankedMatchesDraw",Value:  bDraw ? 1:0}												
			]
		}
	);
	
	
	// SUPER STAR
	if(results.newRank == 26)
	{
		var windata = results.currentWins - results.currentLoses;
		// Before superstar update
		var leaderboard = server.GetLeaderboardAroundUser( // >>>> Playfab Server Call <<<<
			{
				PlayFabId: playerId,
				StatisticName:"Superstar",
				MaxResultsCount :1,
			});
			
		if(leaderboard.Leaderboard[0])
		{
			results.lastSuperstar = leaderboard.Leaderboard[0].Position;
		}
			
		//Update SuperStar
		server.UpdatePlayerStatistics( // >>>> Playfab Server Call <<<<
			{
			PlayFabId: playerId,
			Statistics: [{StatisticName: "Superstar", Value: windata}],
			});
		// After superstar update
		var leaderboard = server.GetLeaderboardAroundUser( // >>>> Playfab Server Call <<<<
			{
				PlayFabId: playerId,
				StatisticName:"Superstar",
				MaxResultsCount :1,
			});
		if(leaderboard.Leaderboard[0])
		{
			results.newSuperstar = leaderboard.Leaderboard[0].Position;
		}
	}

	return results;
}
