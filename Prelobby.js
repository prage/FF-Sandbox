// Initial Data to Setup for a new Player
var InitialPlayerData =
 {
    // Character Customisation
    CharacterCustomisation: "{\"BodyDecalColourPreset\": \"BodyDecalColour_01\", \"EyebrowColourPreset\": \"EyebrowColour_01\", \"EyebrowTexturePreset\": \"EyebrowTexture_01\",        \"EyeMaterialPreset\": \"EyeMaterial_01\",        \"FlightsuitColourPreset1\": \"FlightSuitColour1_04\",        \"FlightsuitColourPreset2\": \"FlightSuitColour2_11\",\"FlightsuitColourPreset3\": \"FlightSuitColour3_10\",\"HairColourPreset\": \"HairColour_01\",\"HairMeshPreset\": \"HairMesh_02\",\"HeadMeshPreset\": \"HeadMesh_01\",\"MakeupColourPreset\": \"MakeupColour_01\",\"MakeupTexturePreset\": \"MakeupTexture_09\",\"Gender\": \"Male\"}",
};

// start values for player stats
var InitialPlayerStats = 
[
	{StatisticName: "Trophies", 		Value: 0},
	{StatisticName: "Rank", 			Value: 1},
	{StatisticName: "MatchesWon", 		Value: 0},
	{StatisticName: "MatchesStarted", 	Value: 0},
	{StatisticName: "MatchesFinished", 	Value: 0},
	{StatisticName: "MostValuedPlayer", Value: 0},
	{StatisticName: "TechPoints",		Value: 0},	
	{StatisticName: "WinningStreak", 	Value: 0}
];

// Should derive this from the store???
// Table for Mastery Vehicle Items
var PlayerMasteryVehicles = 
[
	{CharId: "",	Name:"Angel",			Type:"V_Angel"			},
	{CharId: "",	Name:"T-15 Basilisk",	Type:"V_Basilisk"		},
	{CharId: "",	Name:"T-15 Berzerker",	Type:"V_Berserker"		},
	{CharId: "",	Name:"Big Bob",			Type:"V_BigBob"			},
	{CharId: "",	Name:"Carrier",			Type:"V_Carrier"		},
	{CharId: "",	Name:"Electron",		Type:"V_Electron"		},
	{CharId: "",	Name:"Flaming Blade",	Type:"V_FlamingBlade"	},
	{CharId: "",	Name:"Fog Hog",			Type:"V_FogHog"			},
	{CharId: "",	Name:"Fortress",		Type:"V_Fortress"		},
	{CharId: "",	Name:"Goofer",			Type:"V_Goofer"			},
	{CharId: "",	Name:"Gravitron",		Type:"V_Gravitron"		},
	{CharId: "",	Name:"HammerHead",		Type:"V_HammerHead"		},
	{CharId: "",	Name:"Healing Hippo",	Type:"V_HealingHippo"	},
	{CharId: "",	Name:"Kamikaze",		Type:"V_Kamikaze"		},
	{CharId: "",	Name:"Mob Buddy",		Type:"V_MobBuddy"		},
	{CharId: "",	Name:"Mole",			Type:"V_Mole"			},
	{CharId: "",	Name:"Porcupine",		Type:"V_Porcupine"		},
	{CharId: "",	Name:"Rhino",			Type:"V_Rhino"			},
	{CharId: "",	Name:"Safeguard",		Type:"V_SafeGuard"		},
	{CharId: "",	Name:"Sidewinder",		Type:"V_Sidewinder"		},
	{CharId: "",	Name:"Sniper Price",	Type:"V_SniperPrince"	},	
	{CharId: "",	Name:"Sundog",			Type:"V_SunDog"			},
	{CharId: "",	Name:"Thunder Pulse",	Type:"V_ThunderPulse"	},
	{CharId: "",	Name:"Tiny Giant",		Type:"V_TinyGiant"		},
	{CharId: "",	Name:"Trickster",		Type:"V_Trickster"		},	
	{CharId: "",	Name:"Vampire",			Type:"V_Vampire"		}
];

var PlayerStatistics = 
[
	"MatchesStarted",
	"MatchesFinished",
	"TechPoints",
	"MatchesWon",
	"Rank",
	"Trophies"
];


// Initialises the player with default data
function InitialisePlayer(playerId, fullInitialise)
{
	// Showing we are entering function
	log.info("InitialisePlayer -- Starting");
	
    // Initial Player Data & Stats
    server.UpdateUserData(
	{
	    PlayFabId: playerId,
	    Data: InitialPlayerData,
	    Permission: "Public"
	});

    server.UpdatePlayerStatistics(
	{
	    PlayFabId: playerId,
	    Statistics: InitialPlayerStats,
	});
	
  	// Showing we are leaving function
	log.info("InitialisePlayer -- Leaving");
}

// This function gets called when the player first logs in after the season changes
function InitialisePlayerForSeason(playerId, currentSeason, playerData)
{
    var newSeasonTrophies = playerData.rank;
    var newSeasonRank = GetRankFromTrophies(newSeasonTrophies);
	
    var SeasonResetStats = 
	[
		{StatisticName: "Trophies", 		Value: newSeasonTrophies},
		{StatisticName: "Rank", 			Value: newSeasonRank},
		{StatisticName: "WinningStreak", 	Value: 0}
	];
	
    // Reset Stats
    server.UpdatePlayerStatistics(
	{
	    PlayFabId: playerId,
	    Statistics: SeasonResetStats,
	});
	
    // update season id to new season
    var seasonKey = "CurrentSeasonID";
    var newInternalData = {};
    newInternalData[seasonKey] = currentSeason;
    server.UpdateUserInternalData(
	{
	    PlayFabId: playerId,
	    Data: newInternalData
	});
}

// called when player enters prelobby
function EnterPrelobby(args)
{
    var playerId = args.PlayerUID;
	
    if(playerId == null)
        playerId = currentPlayerId;
	
		
    // Player data to pass back
    var playerData = {
        techPoints: 0,	
        rank: 1,		// updated from server stats
        trophies: 0,		// updated from server stats
        season: 1,		// TODO: Get From global game data       
        CharacterCustomisation:{},
        banned: false,
        bans: [],
        newSeason: false,	// have we started a new season
        newPlayer: false,
        tutorialState : 0,
		VehicleRotationId:"",
		Champions : {},		
		LastSeasonID : lastSeasonID,
        LastSeasonNumber : lastSeasonNumber,
        LastSeasonRank : lastRank,
        SuperStar : false,
        LeaderboardPosition :currentPosition,
        LastLeaderboardPosition : lastPosition,
        CurrentLeaderboardPosition : currentPosition,		
        CurrentSeasonID : currentSeasonId,
        CurrentSeasonNumber : currentSeasonNumber,
        CurrentSeasonRank : currentRank,
        EndTime : currentSeasonEndTime	
    };
	
    // Check if player has been initialised
    var tutorialStateKey = "tutorialState";
    var versionKey = "DataVersion";
    var seasonIDKey = "CurrentSeasonID";
	var seasonStatusKey = "SeasonStatus";
    var lastSeasonStatusKey = "LastSeasonStatus";
	var SeasonChampions = "SeasonChampions";
    var currentVersion = "0.31";
    var IsBetaOrDev = false;
	
    var playerVersionData = server.GetUserInternalData(
	{
	    PlayFabId: playerId,
	    Keys: [versionKey, seasonIDKey, ]
	});	
	
    // get info on user bans
    var playerBanInfo = server.GetUserBans({PlayFabId: playerId});
    // iterate through bans & find active ones
    for(var banNo=0;banNo < playerBanInfo.BanData.length;banNo++)
    {
        var ban = playerBanInfo.BanData[banNo];
        if(ban.active == true)
        {
            playerData.banned = true;
            playerData.bans.push(ban);
        }
    }
		
    var seasonData = server.GetTitleInternalData({Keys:[seasonStatusKey,lastSeasonStatusKey,SeasonChampions,  "ServerType"]});
    var currentSeasonStatus = JSON.parse(seasonData.Data[seasonStatusKey]);
    var currentSeasonId = currentSeasonStatus.SeasonId;

	
    if(seasonData.Data)
	{
		if(seasonData.Data["ServerType"])
		{
			var ServerType = JSON.parse(seasonData.Data["ServerType"]);
			IsBetaOrDev = ServerType.Type == "Dev" || ServerType.Type == "Beta";
		}		
		
		if(seasonData.Data["SeasonChampions"])
		{
			var Statues = JSON.parse(seasonData.Data["SeasonChampions"]);
			playerData.Champions = Statues;
		}
	}
	//===================================================================================================================
	//===================================================================================================================
	// Move into its own function
    // If the player hasn't already been initialised or has the wrong version initialise them
    if(!playerVersionData.Data[versionKey] || playerVersionData.Data[versionKey].Value != currentVersion)
    {
        var fullInit = !playerVersionData.Data[versionKey];

		// 
        InitialisePlayer(playerId, fullInit);
		
        // Update Version NUmber & Season ID
        var newPlayerVersionData = {};
        newPlayerVersionData[versionKey] = currentVersion;
        newPlayerVersionData[seasonIDKey] = currentSeasonId;
	
        playerData.newPlayer = true;
       
        server.UpdateUserInternalData(
		{
		    PlayFabId: playerId,
		    Data: newPlayerVersionData
		});
    }
	
	//===================================================================================================================
	//===================================================================================================================
	
	// Additional Player Data fields
    var additionalPlayerData = server.GetUserData({
			    PlayFabId: playerId,
			    Keys: [ "TutorialState", "VehicleRotationId", "CharacterCustomisation"]
			});
	
	if(additionalPlayerData.Data["CharacterCustomisation"])
        playerData.CharacterCustomisation = JSON.parse(additionalPlayerData.Data["CharacterCustomisation"].Value);
     if(additionalPlayerData.Data["TutorialState"])
        playerData.tutorialState = additionalPlayerData.Data["TutorialState"].Value;	
    if(additionalPlayerData.Data["VehicleRotationId"])
        playerData.VehicleRotationId = additionalPlayerData.Data["VehicleRotationId"].Value;
 
    if(IsBetaOrDev)
		playerData.tutorialState = 3;

    // get player stats
    var playerStatistics = server.GetPlayerStatistics(
    {
        PlayFabId: playerId,
        StatisticNames: PlayerStatistics,
     });
	
	// go through retrieved stats and get what we want
    for(var statNo=0;statNo < playerStatistics.Statistics.length;statNo++)
    {
        var stat = playerStatistics.Statistics[statNo];
		
        if(stat.StatisticName == "TechPoints")
        {
			playerData.techPoints = stat.Value;			
		}
        else if(stat.StatisticName == "Rank")
            playerData.rank = stat.Value;
        else if(stat.StatisticName == "Trophies")
            playerData.trophies = stat.Value;
    }
	
    // Check for new season
    if(!playerVersionData.Data[seasonIDKey] || playerVersionData.Data[seasonIDKey].Value != currentSeasonId)
    {
        InitialisePlayerForSeason(playerId, currentSeasonId, playerData);
        playerData.newSeason = true;
    }
		
    // set current season
    playerData.seasonId = currentSeasonId;
	playerData.CurrentSeasonID = currentSeasonId;
    playerData.collatingSeasonResults = currentSeasonStatus.CollatingResults;
	
	//==========================================================================================
	// COPY OF GET NEW SEASON DATA
	//==========================================================================================
	
	var currentSeasonNumber = 0;
    var lastRank = 1;
    var currentRank = 1;
    var lastPosition = 0
    var currentPosition = 0
    var lastSeasonID = "";
    var lastSeasonNumber = 0;
    var currentSeasonEndTime = 0;
	
    if(seasonData.Data[seasonStatusKey])
    {
        var currentSeasonStatus = JSON.parse(seasonData.Data[seasonStatusKey]);		
     	
        if(currentSeasonStatus.SeasonNumber)
        {
            currentSeasonNumber = currentSeasonStatus.SeasonNumber;
        }		
		
        if(currentSeasonStatus.EndTime)
        {
            currentSeasonEndTime = currentSeasonStatus.EndTime;
        }	
    }
	
    // Current Rank Leaderboard
    var currentSeasonRankLeaderboardVersion = 0;
	
    var playerCurrentRankLeaderboard = server.GetLeaderboardAroundUser(
	{
	    PlayFabId: playerId,
	    StatisticName: "Rank",
	    MaxResultsCount: 1
	});
		
    currentSeasonRankLeaderboardVersion = playerCurrentRankLeaderboard.Version;
	
    // What if im not on the leaderboard
    if(playerCurrentRankLeaderboard.Leaderboard)
    {
        currentPosition = playerCurrentRankLeaderboard.Leaderboard[0].Position;
        currentRank = playerCurrentRankLeaderboard.Leaderboard[0].StatValue;		
    }
	
	
    if(seasonData.Data[lastSeasonStatusKey])
    {
        var lastSeasonStatus = JSON.parse(seasonData.Data[lastSeasonStatusKey]);
        if( (lastSeasonStatus.Rank+1) ==  currentSeasonRankLeaderboardVersion)
        {
            var playerPreviousRankLeaderboard = server.GetLeaderboardAroundUser({
			    PlayFabId: playerId,
			    StatisticName: "Rank",
			    Version: lastSeasonStatus.Rank, // If this version is more than 1 iteration behind the current. We will receive errors.
			    UseSpecificVersion:true,
			    MaxResultsCount: 1
			});	
			
            // What if im not on the leaderboard
            if(playerPreviousRankLeaderboard.Leaderboard)
            {
                lastPosition = playerPreviousRankLeaderboard.Leaderboard[0].Position;
                lastRank = playerPreviousRankLeaderboard.Leaderboard[0].StatValue;
            }
        }
        lastSeasonID = lastSeasonStatus.SeasonId;		
        lastSeasonNumber = lastSeasonStatus.SeasonNumber;
    }

	playerData.LastSeasonID=lastSeasonID;
	playerData.LastSeasonNumber= lastSeasonNumber;
	playerData.LastSeasonRank = lastRank;
	playerData.SuperStar= false;
	playerData.LeaderboardPosition =currentPosition;
	playerData.LastLeaderboardPosition = lastPosition;
	playerData.CurrentLeaderboardPosition = currentPosition;		
	playerData.CurrentSeasonID = currentSeasonId;
	playerData.CurrentSeasonNumber = currentSeasonNumber;
	playerData.CurrentSeasonRank= currentRank;
	playerData.EndTime = currentSeasonEndTime;

	// COPY OF GET NEW SEASON DATA
	//==========================================================================================
	
    // return persistant player data
    return playerData;
}



function GetNewSeasonData(args)
{
    var playerId = currentPlayerId;	
    var seasonStatusKey = "SeasonStatus";
    var lastSeasonStatusKey = "LastSeasonStatus";
    var seasonData = server.GetTitleInternalData({Keys:[seasonStatusKey, lastSeasonStatusKey]});	
	
    var currentSeasonId = "";
    var currentSeasonNumber = 0;
    var lastRank = 1;
    var currentRank = 1;
    var lastPosition = 0
    var currentPosition = 0
    var lastSeasonID = "";
    var lastSeasonNumber = 0;
    var currentSeasonEndTime = 0;
	
    if(seasonData.Data[seasonStatusKey])
    {
        var currentSeasonStatus = JSON.parse(seasonData.Data[seasonStatusKey]);		
        currentSeasonId = currentSeasonStatus.SeasonId;		
		
        if(currentSeasonStatus.SeasonNumber)
        {
            currentSeasonNumber = currentSeasonStatus.SeasonNumber;
        }		
		
        if(currentSeasonStatus.EndTime)
        {
            currentSeasonEndTime = currentSeasonStatus.EndTime;
        }	
    }
	
    // Current Rank Leaderboard
    var currentSeasonRankLeaderboardVersion = 0;
	
    var playerCurrentRankLeaderboard = server.GetLeaderboardAroundUser(
	{
	    PlayFabId: playerId,
	    StatisticName: "Rank",
	    MaxResultsCount: 1
	});
		
    currentSeasonRankLeaderboardVersion = playerCurrentRankLeaderboard.Version;
	
    // What if im not on the leaderboard
    if(playerCurrentRankLeaderboard.Leaderboard)
    {
        currentPosition = playerCurrentRankLeaderboard.Leaderboard[0].Position;
        currentRank = playerCurrentRankLeaderboard.Leaderboard[0].StatValue;		
    }
	
	
    if(seasonData.Data[lastSeasonStatusKey])
    {
        var lastSeasonStatus = JSON.parse(seasonData.Data[lastSeasonStatusKey]);
        if( (lastSeasonStatus.Rank+1) ==  currentSeasonRankLeaderboardVersion)
        {
            var playerPreviousRankLeaderboard = server.GetLeaderboardAroundUser(
			{
			    PlayFabId: playerId,
			    StatisticName: "Rank",
			    Version: lastSeasonStatus.Rank, // If this version is more than 1 iteration behind the current. We will receive errors.
			    UseSpecificVersion:true,
			    MaxResultsCount: 1
			});	
            // What if im not on the leaderboard
            if(playerPreviousRankLeaderboard.Leaderboard)
            {
                lastPosition = playerPreviousRankLeaderboard.Leaderboard[0].Position;
                lastRank = playerPreviousRankLeaderboard.Leaderboard[0].StatValue;
            }
        }
        lastSeasonID = lastSeasonStatus.SeasonId;
		
        lastSeasonNumber = lastSeasonStatus.SeasonNumber;
    }



	
    var Data = {
        LastSeasonID : lastSeasonID,
        LastSeasonNumber : lastSeasonNumber,
        LastSeasonRank : lastRank,
        SuperStar : false,
        LeaderboardPosition :currentPosition,
        LastLeaderboardPosition : lastPosition,
        CurrentLeaderboardPosition : currentPosition,		
        CurrentSeasonID : currentSeasonId,
        CurrentSeasonNumber : currentSeasonNumber,
        CurrentSeasonRank : currentRank,
        EndTime : currentSeasonEndTime
    };		
	
    return Data;
}

handlers.onGetNewSeasonData = function(args)
{
    var argsJSon = JSON.parse(args);
    return GetNewSeasonData(argsJSon);	
}

// Script HandlersonEnterPrelobby	
handlers.onEnterPrelobby = function(args)
{
    var argsJSon = JSON.parse(args);
    return EnterPrelobby(argsJSon);	
}

handlers.getDefaultVehicleSkins = function(args)
{
    var argsJSon = JSON.parse(args);
    return DefaultVehicleSkins(argsJSon);
}	

function DefaultVehicleSkins(args)
{
    var skinDataOutput = {};
	
    var skinData = server.GetUserData(
	{
	    PlayFabId: currentPlayerId,
	    Keys: ["DefaultVehicleSkins"]
	});
		
    // additional player specific data
    if(skinData.Data["DefaultVehicleSkins"])
        skinDataOutput = JSON.parse(skinData.Data["DefaultVehicleSkins"].Value);
		
    return  {
        playerId : currentPlayerId, 
        defaultSkins: skinDataOutput
    };
}
