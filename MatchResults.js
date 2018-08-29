// Handlers for processing match results
var TimedBoostPercent = 20;
var ConsumableBoost = 40;

function CalculateTimedBoost(battlePoints)
{
	// Use Percentage
	return (battlePoints * TimedBoostPercent) / 100;
}

function CalculateConsumableBoost(battlePoints)
{
	// Use Percentage
	return (battlePoints * ConsumableBoost) / 100;
}

// Work out what boost (if any) we can apply to battle points
function CalculateBattlePointBoost(playerUID, battlePoints)
{
	var boostPoints = 0;
    	var inventoryData = server.GetUserInventory({ PlayFabId: playerUID });
	var timedBoost = null;
	var consumableBoost = null;
	
	// Determine if the player has any boosts in their inventory 
	for(var itemIndex=0;itemIndex < inventoryData.Inventory.length;itemIndex++)
	{
		var invItem = inventoryData.Inventory[itemIndex];
	
		if(invItem.ItemClass == "Boost_Timed")	
		{
			timedBoost = invItem;
		}
		if(invItem.ItemClass == "Boost_Consumable")	
		{
			consumableBoost = invItem;
		}
	}
	
	if(timedBoost != null)
	{
		boostPoints = CalculateTimedBoost(battlePoints);
	}
	else if(consumableBoost != null)
	{
		// tell playfab to consume item
		server.ConsumeItem(
			{ 	PlayFabId: playerUID, 
				ItemInstanceId: consumableBoost.ItemInstanceId, 
				ConsumeCount: 1 });
		boostPoints = CalculateConsumableBoost(battlePoints);
	}
    	
	return boostPoints;
}


// This is called by the game server when a match has finished to process the results
// of the match.
// The arguments contain details of the match, teams & players
// Currently has 2 Playfab server calls
function ProcessMatchPlayerResults(args)
{
	// Pull values from args
	var bWon = args.Won;
	var bDraw = args.Draw;
	var bMVP = args.MVP;
	var lootPoints = args.LootPoints;
	var matchLengthMins = args.MatchMinutes;	
	var matchGameTimer = (args.MaxGameTimer * 0.01666666);
	var quarterTime = matchGameTimer * 0.25;
	var viewerCount = args.NumViewers;	
	var gamemode = args.GameMode;
	
	// results object to be passed back
	var results = { 
		playerId: args.PlayerUID,
		playerNetId: args.PlayerNetID, 
		techPointsWon: 0,
		battlePointsWon: 0,
		battlePointsBoost: 0,
		lootWon: [],
		lootBand: 0,
		primaryStartXP:0,
		primaryEndXP:0,
		primaryStartLevel:0,
		primaryEndLevel:0,
		secondaryStartXP:0,
		secondaryEndXP:0,
		secondaryStartLevel:0,
		secondaryEndLevel:0,
		DailyChallenges : ""
	};


	if(bWon)
		results.battlePointsWon = 100;
	else
	{
		if(matchLengthMins< quarterTime)	
		{
			results.battlePointsWon = 25;
		}
		else
		{
			results.battlePointsWon = 50;
		}
	}
	
	if(gamemode=="COOP")
	{
		results.battlePointsWon * 0.5;
	}
	
	results.battlePointsBoost = CalculateBattlePointBoost(args.PlayerUID, results.battlePointsWon);
	results.battlePointsWon += results.battlePointsBoost;	
	
	if(results.battlePointsWon > 0)
	{
		server.AddUserVirtualCurrency(	// >>>> Playfab Server Call <<<<
		{
			PlayFabId: args.PlayerUID,
			VirtualCurrency: "BP",
			Amount: results.battlePointsWon,
		});
	}
	results.techPointsWon = results.battlePointsWon * 97;		// just multiply by prime closest to 100

	// Calculate ranking if it is a ranked game
	if(args.RankedGame)
	{
		results.rankedMatchResults = ProcessRankedMatchResult(args.PlayerUID, bWon, bDraw);
	}
	
	server.UpdatePlayerStatistics( // >>>> Playfab Server Call <<<<
	{
		PlayFabId: args.PlayerUID,
		Statistics: [
			{StatisticName: "TechPoints", 	Value: results.techPointsWon},
			{StatisticName: "MatchesFinished", Value: 1},
			{StatisticName: "MatchesWon", Value: bWon ? 1:0},			
			{StatisticName: "MostValuedPlayer", Value: bMVP ? 1:0}
	    	]
	});

	// Get player stats & put them in results
	var playerStats = server.GetPlayerStatistics( // >>>> Playfab Server Call <<<<
	{
		PlayFabId: args.PlayerUID,
		StatisticNames: ["TechPoints"],
	});
	
	for(var statNo=0;statNo < playerStats.Statistics.length;statNo++)
	{
		var stat = playerStats.Statistics[statNo];
		
		if(stat.StatisticName == "TechPoints")
			results.techPointsTotal = stat.Value;
	}
	
	
	
	
	
	//========================================================================================================
	// Update Daily Challenges
		
	//Get Hold of the users challenges.
	var internalData = server.GetUserReadOnlyData(  // >>>> Playfab Server Call <<<<
	{
		PlayFabId: args.PlayerUID,
		Keys:["DailyChallenges","VehicleMasteryProgress"] 
	});
	

	if(internalData.Data["DailyChallenges"] )
	{
		//EXAMPLE {"Challenge": 1, "Name": "Player", "Objective": "Play_games", "Target": 10, "Claimed" : false, "RewardBP" : 100, "RewardBC" : 20, "Boost" : 25, "Progress" : 0, "Completed" : false }
		var VehicleClasses = {"Scout":["V_MobBuddy","V_Goofer","V_Trickster","V_Porcupine","V_Carrier","V_Angel","V_Gravitron"],"Fighter":["V_FlamingBlade","V_Kamikaze","V_Mole","V_SunDog","V_ThunderPulse","V_SideWinder"],"Tank":["V_Fortress","V_FogHog","V_BigBob","V_SafeGuard"],"Artillery":["V_SniperPrince","V_Electron","V_Berserker"],"Armoured":["V_Vampire","V_HealingHippo","V_TinyGiant"]};
		var ChallengeList = JSON.parse(internalData.Data["DailyChallenges"].Value);
		
		var challengeMsg = "Current Challenges " + internalData.Data["DailyChallenges"].Value;
		log.info(challengeMsg);		
		
		for(var k=0; k<3; k++)
		{
			var challengeModified = false;
			var Challenge = ChallengeList[k];
			var currentChallengeMsg = "Current Challenge " + JSON.stringify(Challenge);
			log.info(currentChallengeMsg);				
			
			var now = new Date();
			now.setHours(0);
			now.setMinutes(0);
			now.setSeconds(0);
			now.setMilliseconds(0);

			// Check the challenge is active. If it has a Refresh Date and the refresh date isnt today.
			if(ChallengeList[k].RefreshDate && ChallengeList[k].RefreshDate >= now.getTime())
			{
				log.info(ChallengeList[k].Name + "  ###  Challenge refreshed today #### Skip processing for this challenge. NEXT!");				
				continue;
			}
			
			
			if(ChallengeList[k].Completed==true)
			{
				log.info(ChallengeList[k].Name + "  ###  Challenge Already completed #### Skip processing for this challenge. NEXT!");	
				continue;
			}
			
			
			if(ChallengeList[k].Name == "Player") // PLAY A GAME
			{
				var message = "Calculating score for challenge [  " + Challenge.Name + "  ]";
				log.info(message);				
				
				ChallengeList[k]["Progress"]++;
				challengeModified = true;
			}		
			else if(ChallengeList[k].Name == "Valued") // MVP
			{
				if(args.MVP)
				{
					ChallengeList[k]["Progress"]++;
					challengeModified = true;
				}
			}
			else if(ChallengeList[k].Name == "Winner") // WIN A GAME
			{
				if(args.Won)
				{
					ChallengeList[k]["Progress"]++;
					challengeModified = true;
				}
			}
			else if(ChallengeList[k].Name == "Damaged_Main") // JUST DO DAMAGE
			{
				ChallengeList[k]["Progress"]+= args.TotalDamage;
				challengeModified = true;
			}
			else if(ChallengeList[k].Name == "Heal_Main") // JUST DO HEALING
			{
				ChallengeList[k]["Progress"]+= args.TotalHealing;
				challengeModified = true;
			}
			else if(ChallengeList[k].Name == "Herder") // MOB SHEPPERDING
			{
				ChallengeList[k]["Progress"]+= args.MobShepherded;
				challengeModified = true;
			}
			else if(ChallengeList[k].Name == "Killer") // ELIMINATIONS
			{
				ChallengeList[k]["Progress"]+= args.TotalKills;
				challengeModified = true;
			}
			else if(ChallengeList[k].Name == "Mob_Enemy") // MOBS KILLED
			{
				ChallengeList[k]["Progress"]+= args.MobsKilled;
				challengeModified = true;
			}
			else if(ChallengeList[k].Name == "Scout_Main") // PLAY AS SCOUT
			{
				if(VehicleClasses["Scout"].includes(args.PrimaryVehicle) || VehicleClasses["Scout"].includes(args.SecondaryVehicle))
				{
					ChallengeList[k]["Progress"]++;
					challengeModified = true;
				}			
			}
			else if(ChallengeList[k]["Name"] == "Fighter_Main") // PLAY AS FIGHTER
			{
				if(VehicleClasses["Fighter"].includes(args.PrimaryVehicle) || VehicleClasses["Fighter"].includes(args.SecondaryVehicle))
				{
					ChallengeList[k]["Progress"]++;
					var messy = ChallengeList[k];
					log.info(messy);
					challengeModified = true;
				}		
			}
			else if(ChallengeList[k].Name == "Tank_Main") // PLAY AS TANK
			{
				if(VehicleClasses["Tank"].includes(args.PrimaryVehicle) || VehicleClasses["Tank"].includes(args.SecondaryVehicle))
				{
					ChallengeList[k]["Progress"]++;
					challengeModified = true;
				}		
			}
			else if(ChallengeList[k].Name == "Artillery_Main") // PLAY AS ARTILLERY
			{
				if(VehicleClasses["Artillery"].includes(args.PrimaryVehicle) || VehicleClasses["Artillery"].includes(args.SecondaryVehicle))
				{
					ChallengeList[k]["Progress"]++;
					challengeModified = true;
				}		
			}
			else if(ChallengeList[k].Name == "Armoured_Main") //PLAY AS ARMOURED
			{
				if(VehicleClasses["Armoured"].includes(args.PrimaryVehicle) || VehicleClasses["Armoured"].includes(args.SecondaryVehicle))
				{
					ChallengeList[k]["Progress"]++;
					challengeModified = true;
				}		
			}
			else if(ChallengeList[k].Name == "Experience") // EARN XP
			{
				ChallengeList[k]["Progress"]+= args.MatchXP;
				challengeModified = true;
			}
			else if(ChallengeList[k].Name == "Tower_Destroyer") // POWER CORE DAMAGE
			{
				ChallengeList[k]["Progress"]+= args.ReactorDamage;
				challengeModified = true;
			}
			
			if(ChallengeList[k]["Progress"]>=ChallengeList[k].Target)
			{
				if(ChallengeList[k].Completed==false)
				{
					var message = "Challenge [" + ChallengeList[k].Name + "] Completed #### Progress ["+ ChallengeList[k]["Progress"] + "] Target [" + ChallengeList[k]["Target"] + "]";
					log.info(message);				
				}			
				
				ChallengeList[k].Completed=true;				
				challengeModified = true;
				
				// SWIT-10060 -- Cap Progress
				if (ChallengeList[k]["Progress"] > ChallengeList[k]["Target"])
				{
					ChallengeList[k]["Progress"] = ChallengeList[k]["Target"];
					log.info("Challenge [" + ChallengeList[k].Name + "] Clamped #### Progress ["+ ChallengeList[k]["Progress"] + "] Target [" + ChallengeList[k]["Target"] + "]");
				}
			}	

			// Check if modified?
			if (challengeModified)
			{
				var modified = new Date();
				var time = modified.getTime(); // miliseconds
				ChallengeList[k].Updated = time;
				ChallengeList[k].Modified = time;
			}					
		}
		
		// return the daily challenges structure back to the server
		results.DailyChallenges = JSON.stringify(ChallengeList);
		
		var outData = {};		
		outData["DailyChallenges"] = JSON.stringify(ChallengeList);

		var updateReadonly = server.UpdateUserReadOnlyData({  // >>>> Playfab Server Call <<<<
								PlayFabId: args.PlayerUID,
								Data: outData});

	}
	// END Daily Challenges ##
	//========================================================================================================
	

	//========================================================================================================
	// Vehicle Mastery
	//========================================================================================================
	// DATA TABLE VERSION
	var titledata = server.GetTitleData({Keys:["MasteryVehicleRewards"]});
	var masteryLevels = JSON.parse(titledata.Data["MasteryVehicleRewards"]);
	if(internalData.Data["VehicleMasteryProgress"] )
	{			
		var masteryProgressTable = JSON.parse(internalData.Data["VehicleMasteryProgress"].Value);	
		
		for(var i=0; i<masteryProgressTable.length; i++)
		{		
			var XP = masteryProgressTable[i].XP;
			var newXP = 0;			
			var currentLvl = GetMasteryLevel(masteryLevels, XP);
			
			if(masteryProgressTable[i].MasteryVehicle.toUpperCase() == args.PrimaryVehicle.toUpperCase() )
			{
				newXP = XP + args.PrimaryVehicleXP;	
				results.primaryStartXP = XP;
				results.primaryEndXP = newXP;	
				results.primaryStartLevel = currentLvl;
				
				var newLvl = GetMasteryLevel(masteryLevels, newXP);
			
				masteryProgressTable[i].XP = newXP;
				masteryProgressTable[i].Level = newLvl;
				
				if(currentLvl != newLvl)
				{
					AwardMasteryLevelReward(args.PlayerUID, masteryLevels, newLvl);
				}					
				results.primaryEndLevel = newLvl;		
			}
			else if( masteryProgressTable[i].MasteryVehicle.toUpperCase() == args.SecondaryVehicle.toUpperCase())
			{
				newXP = XP + args.SecondaryVehicleXP;		
				results.secondaryStartXP = XP;
				results.secondaryEndXP =  newXP;	
				results.secondaryStartLevel = currentLvl;				
				var newLvl = GetMasteryLevel(masteryLevels, newXP);			
				masteryProgressTable[i].XP = newXP;
				masteryProgressTable[i].Level = newLvl;
				
				if(currentLvl != newLvl)
				{
					AwardMasteryLevelReward(args.PlayerUID, masteryLevels, newLvl);
				}			
				results.secondaryEndLevel = newLvl;					
			}			
		}
		
		var outData = {};		
		outData["VehicleMasteryProgress"] = JSON.stringify(masteryProgressTable);
	
		var updateReadonly = server.UpdateUserReadOnlyData({  // >>>> Playfab Server Call <<<<
								PlayFabId: args.PlayerUID,
								Data: outData});
	}
	

	// End of Vehicle Mastery
	//========================================================================================================
	return results;
}


function GetMasteryLevel(MasteryTable, XP)
{	
	var Level = -1;

	for(var j=MasteryTable.length-1; j >=0 ; j--)
	{						
		if(XP >= MasteryTable[j].Unlock)
		{
			Level = MasteryTable[j].Level;	
			break;
		}						
	}			
	return Level;
}



function AwardMasteryLevelReward(playerId, masteryLevels, RewardLevel)
{
	log.info("AWARDING ["+masteryLevels[RewardLevel].Level + "  ][  " + masteryLevels[RewardLevel].RewardType+"  ][ " + masteryLevels[RewardLevel].Value+" ]");	
	
	if(masteryLevels[RewardLevel].RewardType == "MCI")
	{
		/*var itemid = "sk_" + character.CharacterType + "_" + masteryLevels[RewardLevel].Value;
							
		var itemsAwarded = server.GrantItemsToUser(	// >>>> Playfab Server Call <<<<
		{
			PlayFabId: playerId,
			ItemIds: [itemid]
		});*/
	}
	else if(masteryLevels[RewardLevel].RewardType == "BP" || masteryLevels[RewardLevel].RewardType == "BC")
	{		
		server.AddUserVirtualCurrency(	// >>>> Playfab Server Call <<<<
		{
			PlayFabId: playerId,
			VirtualCurrency: masteryLevels[RewardLevel].RewardType,
			Amount: masteryLevels[RewardLevel].Value
		});
	}		
	return 0;
}


// Script Handlers
handlers.processMatchPlayerResults = function(args)
{
	var jsonArgs = JSON.parse(args);
	log.info(jsonArgs);
	return ProcessMatchPlayerResults(jsonArgs);	
}
