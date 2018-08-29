// Define Keys
// Defines for Storage Keys
var _DailyChallengesRollOverKey = "DailyChallengeRollover"
var _DailyChallengesKey = "DailyChallenges";
var _VersionKeyDailyChallenges = "DailyChallengesVersion";
var _DailyChallengesCompletedKey = "DailyChallengesCompleted";

// Add Version Control for Challenge data
function GetDailyChallengeVersion()
{
	// Challenges Version History
	// var DailyChallengeVersion = 0.1;	// Initial Version
	// var DailyChallengeVersion = 0.2;	// Moved DailyChallengeVersion to UserInernalData
	// var DailyChallengeVersion = 0.3;	// Added "RewardCosmetic" to Challenges
	// var DailyChallengeVersion = 0.4;	// Changed "Blade" to number 15 Challenge
	// var DailyChallengeVersion = 0.5;	// Changed RefreshTime" to "RefreshDate" 
	//var DailyChallengeVersion = 0.6;	// Split Actions
	// var DailyChallengeVersion = 0.7;	// Added DailyChallengeRoOver counter
	// var DailyChallengeVersion = 0.8;	// Added CompletedTime field
	// var DailyChallengeVersion = 0.9;	// Changed way RefreshDate field used
	var DailyChallengeVersion = 1.0;	// Changed RefreshDate to time at midnight
	return DailyChallengeVersion;
}

// Set RefreshDate
function GenerateChallengeNextRefreshTime()
{
	// Set Refresh for Midnight
	var refreshtime = new Date();
	refreshtime.setHours(23);
	refreshtime.setMinutes(59);
	refreshtime.setSeconds(59);
	refreshtime.setMilliseconds(999);
	var timenextrefresh = refreshtime.getTime();

	// Calculate Current Time in MS
	var currenttime = new Date();
	var currtimeinms = currenttime.getTime();
	// log.info("GenerateChallengeNextRefreshTime : currtimeInMs : " + currtimeinms + " timeNextRefresh : " + timenextrefresh +  " Diff : " + (timenextrefresh-currtimeinms));
	return timenextrefresh;
}

// Get Challenges RollOver Counter
function GetDailyChallengeRollover(playerId)
{
	// Read Rollover Count
	var existingChallengesRollover = 0;
	existingDailyChallengesRollOver = server.GetUserInternalData({PlayFabId: playerId, Keys: [_DailyChallengesRollOverKey]});
	if (existingDailyChallengesRollOver.Data[_DailyChallengesRollOverKey])
	{
		// Read Value but returns as String
		var readChallengesRollover = JSON.parse(existingDailyChallengesRollOver.Data[_DailyChallengesRollOverKey].Value);
		return readChallengesRollover;
	}
	
	return existingChallengesRollover;
}

// Set Challenges RollOver Counter
function IncrementDailyChallengeRollover(playerId)
{
	// Read Rollover Count
	var existingChallengesRollover = 0;
	existingChallengesRollover = GetDailyChallengeRollover(playerId);
	
	// Set ChallengeRollover Counter
	var newChallengeRollOverData={};
	var newChallengesRollover = existingChallengesRollover;
	newChallengesRollover++;
	
	// NOTE : According to Design --- 1 ReRoll ONLY, do not accumulate
	if (newChallengesRollover > 1)
	{
		newChallengesRollover = 1;
	}
	
	// log.info("IncrementDailyChallengeRollover : playerId : " + playerId + " UPDATE : RollOver : " + newChallengesRollover);
	newChallengeRollOverData[_DailyChallengesRollOverKey] = newChallengesRollover;

	server.UpdateUserInternalData(  {
		PlayFabId: playerId,
		Data: newChallengeRollOverData
	});	
	
	// log.info("IncrementDailyChallengeRollover : playerId : " + playerId + " RollOver : " + existingChallengesRollover +  " : "+ newChallengesRollover);
	return newChallengesRollover;
}

// Set Challenges RollOver Counter
function DecrementDailyChallengeRollover(playerId)
{
	// Read Rollover Count
	var existingChallengesRollover = 0;
	existingChallengesRollover = GetDailyChallengeRollover(playerId);
	// log.info("DecrementDailyChallengeRollover : playerId : " + playerId + " OLD : RollOver : " + existingChallengesRollover);
	
	// Set ChallengeRollover Counter
	var newChallengeRollOverData={};
	var newChallengesRollover = existingChallengesRollover;
	newChallengesRollover--;
	if ( newChallengesRollover < 0)
	{
		newChallengesRollover = 0;
	}
	newChallengeRollOverData[_DailyChallengesRollOverKey] = newChallengesRollover;

	server.UpdateUserInternalData(  {
		PlayFabId: playerId,
		Data: newChallengeRollOverData
	});	
	
	// log.info("DecrementDailyChallengeRollover : playerId : " + playerId + " RollOver : " + existingChallengesRollover +  " : "+ newChallengesRollover);
	return newChallengesRollover;
}

function CheckDailyChallengeDataVersion(playerId)
{
	// Read existing Challenges
	var validChallengeVersion = false;
    var existingDailyChallenges = server.GetUserReadOnlyData({PlayFabId: playerId, Keys: [_DailyChallengesKey]});
	if (existingDailyChallenges.Data[_DailyChallengesKey])
	{
		// Read Version from Internal Area
		// Check Version matches
		var dataVersion = GetDailyChallengeVersion();
		var existingVersion = server.GetUserInternalData({PlayFabId: playerId, Keys: [_VersionKeyDailyChallenges]});
		var playerDataVersion = JSON.parse(existingVersion.Data[_VersionKeyDailyChallenges].Value);
		// log.info("CheckDailyChallengeDataVersion : playerId : " + dataVersion + " playerDataVersion : " + playerDataVersion);
		if( existingVersion.Data[_VersionKeyDailyChallenges] && playerDataVersion == dataVersion)
		{
			// Looks like we have latest version
			validChallengeVersion = true;
		}
	}
	
	// Do we need to regenerate
	if (!validChallengeVersion)
	{
		// Need to Setup Initial Entries
		log.info("CheckDailyChallengeDataVersion : Setting INITIAL Challenges");
		
		// Create Random Sequenced
		var bRandomChallenges = true;
		GenerateDailyChallenges(playerId, bRandomChallenges);
		
		// Reset ChallengeRollover Counter
		var dataVersion = GetDailyChallengeVersion();
		var completedChallenges = [];
		var newChallengeData={};
		newChallengeData[_DailyChallengesRollOverKey] = 0;
		newChallengeData[_VersionKeyDailyChallenges] = dataVersion;
		newChallengeData[_DailyChallengesCompletedKey] = completedChallenges;

		server.UpdateUserInternalData(  {
			PlayFabId: playerId,
			Data: newChallengeData
		});	
	
		// Read new generated Challenges
		existingDailyChallenges = server.GetUserReadOnlyData({PlayFabId: playerId, Keys: [_DailyChallengesKey]});
	}
	
	// Return Parsed Structure
	var dailyChallengesParsed = JSON.parse(existingDailyChallenges.Data[_DailyChallengesKey].Value);
	// log.info("CheckDailyChallengeDataVersion : dailyChallenges : " + JSON.stringify(dailyChallengesParsed));
	return dailyChallengesParsed;
}

// Generate Daily Challenges
function GetDailyChallenges(playerId)
{
	// Check Daily Challenges valid
	var dailyChallengesParsed = CheckDailyChallengeDataVersion(playerId);
	// log.info(dailyChallengesParsed.length);
	// log.info("GetDailyChallenges : Extracted dailyChallenges : " + JSON.stringify(dailyChallengesParsed));

	// Work out whether this challenge has been re-rolled by checking for the RefreshDate. 
	var now = new Date();
	var currtime = now.getTime();
	// log.info("GetDailyChallenges : Now msec --  %d " + currtime);
	
	// Check for Next Refreshtime
	var challengesInfoChanged = false;
	for(var i=0; i<dailyChallengesParsed.length; i++)
	{
		// TODO, Write out whether it needs its active flag updating
		if(dailyChallengesParsed[i].RefreshDate)
		{	
			var challengeChanged = false;
			var prevChallengeActiveState = dailyChallengesParsed[i].Active;
			var newChallengeActiveState = dailyChallengesParsed[i].Active;
			// log.info("GetDailyChallenges [" + i + "] : Now msec -- " + now.getTime() +  " RefreshDate : " + dailyChallengesParsed[i].RefreshDate);
			if( dailyChallengesParsed[i].RefreshDate < now.getTime())
			{
				newChallengeActiveState = true;
				dailyChallengesParsed[i].RefreshDate = 0;
				challengesInfoChanged = true;
			}
			else
			{
				newChallengeActiveState = false;	
			}	
			
			// Check if Change happening
			if ( newChallengeActiveState != prevChallengeActiveState)
			{
				dailyChallengesParsed[i].Active = newChallengeActiveState;
				challengesInfoChanged = true;
			}
		}
		
		// Change Updated Timestamp
		dailyChallengesParsed[i].Updated = currtime;
	}	
	
	// Display Challenges
	// log.info("GetDailyChallenges : Latest dailyChallenges : " + JSON.stringify(dailyChallengesParsed));
	if (challengesInfoChanged == true)
	{
		log.info("GetDailyChallenges : challengesInfoChanged : " + challengesInfoChanged);
		//==============================================================================================================================
		// Update Challenge List
		//==============================================================================================================================
		var updateChallengesData = [];
		// All Challenges and Blade
		for(var j=0; j<4; j++)
		{
			var challengeInfo = dailyChallengesParsed[j];
			updateChallengesData.push(challengeInfo);
		}
		
		// Need to Update Daily Challenges
		var updateDailyChallengesInternalData = {};
		updateDailyChallengesInternalData[_DailyChallengesKey] = JSON.stringify(updateChallengesData);
		log.info("GetDailyChallenges - REFRESHING : " + JSON.stringify(updateChallengesData) );
		server.UpdateUserReadOnlyData(
		{
			PlayFabId: playerId,
			Data: updateDailyChallengesInternalData
		});	
	}
	
	// Return Challenges
	var dailyChallengesRollover = GetDailyChallengeRollover(playerId);
	// log.info("GetDailyChallenges : dailyChallengesRollover : " + dailyChallengesRollover);
    var activeDailyChallenges =
	{
        DailyChallenges : dailyChallengesParsed,
		DailyRollOver : dailyChallengesRollover,
	};
	return activeDailyChallenges;
}

// Generate Initial Daily Challenges
function GenerateDailyChallenges(playerId, bRandomChallenges)
{
	// Check Random or Sequenced
	var challengeIndex = [ -1, -1, -1];
	var index=0;
	if (bRandomChallenges)
	{
		// Generate 3 Random numbers
		do
		{
			// Get next Challenge Index 1-15
			var randNum = Math.floor((Math.random() * 15));
			// log.info("GenerateDailyChallenges: Challenge[" + index + "] : Random = " + randNum);
			
			// Check if index is unique?
			var alreadUsedIndex = false;
			for(var k=0; k<=3; k++)
			{
				if ( randNum == challengeIndex[k] )
				{
					// already exits
					alreadUsedIndex = true;
				}
			}
			
			// Can we use new number?
			if (!alreadUsedIndex)
			{
				// Save 
				challengeIndex[index] = randNum;
				index++
			}
		}
		while ( index < 3);
	}
	else
	{
		// Fixed Sequence start at 0-2
		for(var k=0; k <3; k++)
		{
			// Index get Adjusted, shift to 1-3
			challengeIndex[k] = k+1;
		}
	}
	
	// List of Challenges
    var titleInternalData = server.GetTitleInternalData({Keys:["Challenges"]});
	var challenges = titleInternalData.Data["Challenges"];
	var parsedChallenges = JSON.parse(challenges);
	
	// Setup Created and Modified timestamps
    var now = new Date();		// Date
	var time = now.getTime();	// miliseconds

	// Add Daily Challenges
	var updateChallengesData = [];
	var activationDate = new Date(now);
	activationDate.setDate(activationDate.getDate() + 1);
	for(var j=0; j<3; j++)
	{
		// Index the Challenges table
		var index = challengeIndex[j];
		var offset = index-1;
		if ( offset < 0)
			offset = 0;
		// log.info("GenerateDailyChallenges: [" + index + "] : offset = " + offset);
		var challengeInfo = parsedChallenges[offset];
		
		challengeInfo["Created"] = time;
		challengeInfo["Modified"] = time;
		challengeInfo["Updated"] = time;
		challengeInfo["ClaimTime"] = 0;
		challengeInfo["CompletedTime"] = 0;
		challengeInfo["RefreshDate"] = 0;
		challengeInfo["Active"] = true;
		
		// Add Challenge
		// log.info("GenerateDailyChallenges: Challenge[" + j + "] = " + JSON.stringify(challengeInfo));
		updateChallengesData.push(challengeInfo);
	}
	
	// Add Blade Challenge
	var bladeChallenge = parsedChallenges[15];
	
	// Setup Created and Modified timestamps
	var now =  now.getTime();			// milliseconds
	bladeChallenge["Created"] = time;
	bladeChallenge["Modified"] = time;	
	bladeChallenge["Updated"] = time;
	
	// Reset Claimed Flags
	bladeChallenge["ClaimTime"] = 0;
	bladeChallenge["CompletedTime"] = 0;
	bladeChallenge["RefreshDate"] = 0;
	
	bladeChallenge["Active"] = true;
	updateChallengesData.push(bladeChallenge);
	// log.info("Challenge[" + j + "] = " + JSON.stringify(bladeChallenge));

	// Need to Update Daily Challenges
	var updateDailyChallengesInternalData = {};
	updateDailyChallengesInternalData[_DailyChallengesKey] = JSON.stringify(updateChallengesData);
	// log.info("GenerateDailyChallenges - WRITE = " + JSON.stringify(updateChallengesData) );
	server.UpdateUserReadOnlyData(
	{
		PlayFabId: playerId,
		Data: updateDailyChallengesInternalData
	});	

	// Read new generated Challenges
	// log.info("GenerateDailyChallenges : dailyChallenges : " + JSON.stringify(dailyChallengesParsed));
	var dailyChallengesRollover = GetDailyChallengeRollover(playerId);
    var activeDailyChallenges =
	{
        DailyChallenges : updateChallengesData,
		DailyRollOver : dailyChallengesRollover,
	};
	return activeDailyChallenges;
}

// Generate Random Initial Daily Challenges
function GenerateRandomDailyChallenges(playerId)
{
	// Check Daily Challenges valid
	var existingDailyChallenges = CheckDailyChallengeDataVersion(playerId);
	
	// Reset ChallengeRollover Counter
	var dataVersion = GetDailyChallengeVersion();
	var completedChallenges = [];
	var newChallengeData={};
	newChallengeData[_DailyChallengesRollOverKey] = 0;
	newChallengeData[_VersionKeyDailyChallenges] = dataVersion;
	newChallengeData[_DailyChallengesCompletedKey] = completedChallenges;

	server.UpdateUserInternalData(  {
		PlayFabId: playerId,
		Data: newChallengeData
	});	
	
	// Create Random Sequence
	var bRandomChallenges = true;
	var dailyChallengesParsed = GenerateDailyChallenges(playerId, bRandomChallenges);;
	return dailyChallengesParsed;
}

// Generate Fixed Daily Challenges
function GenerateFixedDailyChallenges(playerId)
{
	// Check Daily Challenges valid
	var existingDailyChallenges = CheckDailyChallengeDataVersion(playerId);
	
	// Reset ChallengeRollover Counter
	var dataVersion = GetDailyChallengeVersion();
	var completedChallenges = [];
	var newChallengeData={};
	newChallengeData[_DailyChallengesRollOverKey] = 0;
	newChallengeData[_VersionKeyDailyChallenges] = dataVersion;
	newChallengeData[_DailyChallengesCompletedKey] = completedChallenges;

	server.UpdateUserInternalData(  {
		PlayFabId: playerId,
		Data: newChallengeData
	});	
	
	// Create Fixed Sequence
	var bRandomChallenges = false;
	var dailyChallengesParsed = GenerateDailyChallenges(playerId, bRandomChallenges);;
	return dailyChallengesParsed;
}

// Refresh Daily Challenges
// If there are no challenges then generate some
// Generate new challenge when its completed and claimed.
function RefreshDailyChallengesByIdAndUpdateBlade(args)
{
	// Extract the Challenge Id
    var playerId = args.PlayerUID;
	var challengeId = args.ChallengeId;
	// log.info("RefreshDailyChallengesByIdAndUpdateBlade : playerId : " + playerId +  " challengeId : " + challengeId);

	// Parse dailyChallenges
	var dailyChallengesParsed = CheckDailyChallengeDataVersion(playerId);
	
	// Read existing Challenges Id - Indices
	var existingChallengeIndex = [ -1, -1, -1]; // So when we roll a new one its not duplicated/ 
	// Extract existing Selection
	for(var i=0; i<3; i++)
	{
		// pull out challenge Id and convert to index
		var challengeInfo = dailyChallengesParsed[i];
		existingChallengeIndex[i] = challengeInfo.Challenge;
	}

	//==============================================================================================================================
	// Completed and Claimed challenges need rolling over.
	//==============================================================================================================================
	var updateChallengeIndex = [ -1, -1, -1];
	var needToRefreshAnySlots = 0;
	for(var index=0; index<3; index++)
	{
		// Check if Challenge completed
		var challengeInfo = dailyChallengesParsed[index];
	
		// Only Refresh Completed and Claimed Challenges
		if ( challengeInfo.Completed && challengeInfo.Claimed && challengeInfo.Challenge == challengeId )
		{
			// Looks like we have more work to do.	
			needToRefreshAnySlots++;
		}
		else
		{
			// No operation needed on this challenge
			updateChallengeIndex[index] = challengeInfo.Challenge;	
		}
	}
	
	//==============================================================================================================================
	// Display Existing List
	//==============================================================================================================================
	for(var k=0; k<3; k++)
	{
		// log.info("RefreshDailyChallengesByIdAndUpdateBlade : [" + k + "]: existingChallengeIndex : " + existingChallengeIndex[k] +  " updateChallengeIndex : " + updateChallengeIndex[k]);
	}

	//==============================================================================================================================
	// Generate new Challenges for any completed challenge
	//==============================================================================================================================
	log.info("RefreshDailyChallengesByIdAndUpdateBlade : needToRefreshAnySlots : " +  needToRefreshAnySlots);
	if ( needToRefreshAnySlots > 0)
	{
		// calculate new challenge to replace completed
		for(var updateSlot=0; updateSlot < needToRefreshAnySlots; updateSlot++)
		{
			// Next slot to update
			for(var k=0; k<=3; k++)
			{
				// Find slot that needs updating.
				if (updateChallengeIndex[k] == -1)
				{
					// Lets Generate next Random Challenge
					var alreadUsedIndex = false;
					do
					{
						// Get next Challenge Index 1-15
						var randNum = Math.floor((Math.random() * 15));
						
						// Check if index is unique?
						alreadUsedIndex = false;
						for(var l=0; l<=3; l++)
						{
							if ( randNum == existingChallengeIndex[l] )
							{
								// already exits
								alreadUsedIndex = true;
							}
						}
						
						// Can we use new number?
						if (!alreadUsedIndex)
						{
							// Save 
							updateChallengeIndex[k] = randNum;
							index++
						}
					}
					while ( alreadUsedIndex);
				}
			}					
		}
	}

	//==============================================================================================================================
	// Display new List
	//==============================================================================================================================
	for(var k=0; k<3; k++)
	{
		// log.info("RefreshDailyChallengesByIdAndUpdateBlade : REFRESH : [" + k + "]: existingChallengeIndex : " + existingChallengeIndex[k] +  " updateChallengeIndex : " + updateChallengeIndex[k]);
	}

	//==============================================================================================================================
	// Generate new List
	//==============================================================================================================================

	// List of Challenges
	var ChallengeTemplates = server.GetTitleInternalData({Keys:["Challenges"]});
	var challenges = ChallengeTemplates.Data["Challenges"];
	var parsedChallenges = JSON.parse(challenges);
	if (needToRefreshAnySlots )
	{
		// REBUILD THE CHALLENGE LIST OBJECT
		var updateChallengesData = [];
		for(var j=0; j<3; j++)
		{
			// Check if we have new Challenge?
			// log.info("RefreshDailyChallengesByIdAndUpdateBlade [" + j + "]: existingChallengeIndex : " + existingChallengeIndex[j] +  " updateChallengeIndex : " + updateChallengeIndex[j]);
			if (  existingChallengeIndex[j] != updateChallengeIndex[j] )
			{
				// New Challenge
				var index = updateChallengeIndex[j];
				var offset = index-1;
				if ( offset < 0 )
					offset = 0;
				var challengeInfo = parsedChallenges[offset];
				
				// Setup Created and Modified timestamps
				var now = new Date();		// Date
				var time = now.getTime(); // miliseconds
				challengeInfo.Created = time;
				challengeInfo.Updated = time;
				challengeInfo.Modified = time;

				// Mark for Next Day unlook
				var timetorefresh = GenerateChallengeNextRefreshTime(); // miliseconds
				challengeInfo["Active"] = false;
				challengeInfo["RefreshDate"] = timetorefresh;
				
				// Add Challenge
				updateChallengesData.push(challengeInfo);
				// log.info("RefreshDailyChallengesById : UPDATE : challengeInfo : " + JSON.stringify(challengeInfo));
			}
			else
			{
				// Use Exiting Challenge
				var challengeInfo = dailyChallengesParsed[j];
				updateChallengesData.push(challengeInfo);
				// log.info("RefreshDailyChallengesById : KEEP : challengeInfo : " + JSON.stringify(challengeInfo));
			}
		}
	
		// Update Blade Challenge Details as well
		var bladeChallenge = dailyChallengesParsed[3];
		bladeChallenge.Progress = bladeChallenge.Progress + 1;
		if ( bladeChallenge.Progress >= bladeChallenge.Target)
		{
			// Set Blade Completed Challenge as well
			bladeChallenge.Completed = true;
			bladeChallenge.Progress = bladeChallenge.Target;
			
			// Reset Blade challenge
			bladeChallenge = parsedChallenges[15];
			
			// Reset Creation time
			var now = new Date();		// Date
			var time = now.getTime();	// miliseconds
			bladeChallenge.Created = time;
			bladeChallenge.Modified = time;
			bladeChallenge.Updated = time;
			
			// Reset associated fields
			bladeChallenge.Active = true;
			bladeChallenge.RefreshDate = 0;
			bladeChallenge.ClaimTime = 0;
			bladeChallenge.CompletedTime = 0;
		}
		
		// Add Blade Challenge
		updateChallengesData.push(bladeChallenge);
		// log.info("RefreshDailyChallengesById : bladeChallenge : " + JSON.stringify(bladeChallenge));
		// log.info("RefreshDailyChallengesById : updateChallengesData : " + JSON.stringify(updateChallengesData));
		
		// Write it back into the player
		// Need to Update Daily Challenges On the player data
		var updateDailyChallengesInternalData = {};
		updateDailyChallengesInternalData[_DailyChallengesKey] = JSON.stringify(updateChallengesData);
		
		server.UpdateUserReadOnlyData(
		{
			PlayFabId: playerId,
			Data: updateDailyChallengesInternalData
		});	

		// // Read new generated Challenges
		var dailyChallengesRollover = GetDailyChallengeRollover(playerId);
		var activeDailyChallenges =
		{
			DailyChallenges : updateChallengesData,
			DailyRollOver : dailyChallengesRollover
		};
		// log.info("RefreshDailyChallengesById : activeDailyChallenges : " + JSON.stringify(activeDailyChallenges));
		return activeDailyChallenges;		
	}
	
	// Get New Generated List
	return GetDailyChallenges(playerId);
}

// Can only claim one challenge at a time.
function ClaimDailyChallengeReward(args)
{   
	// Extract the Challenge Id
    var playerId = args.PlayerUID;
	var challengeId = args.ChallengeId;
	
	log.info("ClaimDailyChallengeReward : playerId : " + playerId +  " challengeId : " + challengeId);
	
	//==========================================================================================================================================================================
	// Read existing Challenges
	//==========================================================================================================================================================================
	//var validChallengeVersion = false;
    var dailyChallengesParsed =  CheckDailyChallengeDataVersion(playerId);
	
	//==========================================================================================================================================================================
	// Check and see if Challenge is Completed and Not Claimed
	//==========================================================================================================================================================================
	var pendingclaimChallengeIndex = -1;
	for(var index=0; index<3; index++)
	{
		// Check if Challenge completed
		var challengeInfo = dailyChallengesParsed[index];
		// log.info("ClaimDailyChallengeReward : [" + index + "] challengeId : " + challengeInfo.Challenge + " Completed : " + challengeInfo.Completed + " Claimed : " + challengeInfo.Claimed);
		if (challengeInfo.Challenge == challengeId && challengeInfo.Completed && (challengeInfo.Claimed == false))
		{
			// Looks like we have more work to do.
			pendingclaimChallengeIndex = index;
		}		
	}
	
	//==============================================================================================================================
	// Award the claim. 
	//==========================================================================================================================================================================
	log.info("ClaimDailyChallengeReward : pendingclaimChallengeIndex : " + pendingclaimChallengeIndex);
	if (pendingclaimChallengeIndex != -1)
	{
		// Setup link to Blade Challenge
		var bBladeUpdated = false;
		var bladeChallenge = dailyChallengesParsed[3];

		// Challenge Info
		var challengeInfo = dailyChallengesParsed[pendingclaimChallengeIndex];
		var BC = challengeInfo.RewardBC;
		var BP = challengeInfo.RewardBP;
		
		// Storage for Sending new Amounts
		if(BC>0)
		{
			// log.info("ClaimDailyChallengeReward : Award Virtual BC : " + BC);
			server.AddUserVirtualCurrency(
			{
				PlayFabId: playerId,
				VirtualCurrency: "BC",
				Amount: BC
			});
		}
		if(BP>0)
		{
			// log.info("ClaimDailyChallengeReward : Award Virtual BP : " + BP);
			server.AddUserVirtualCurrency(
			{
				PlayFabId: playerId,
				VirtualCurrency: "BP",
				Amount: BP
			});
		}

		//==============================================================================================================================
		// STORE A HISTORY OF COMPLETED CHALLENGES	
		// Save Information on Completed List
		//==========================================================================================================================================================================
		var completedChallengeInfoData = server.GetUserReadOnlyData(
		{
			PlayFabId: playerId,
			Keys: [_DailyChallengesCompletedKey]
		});
	
		// Check results from Server
		newCompletedChallengeInfo = dailyChallengesParsed[pendingclaimChallengeIndex];
		
		// Add to list. 
		if (completedChallengeInfoData.Data[_DailyChallengesCompletedKey])
		{
			// Get Current List
			var completeDailyChallenges = JSON.parse(completedChallengeInfoData.Data[_DailyChallengesCompletedKey].Value);
			// log.info(completeDailyChallenges);
	
			// Check if we appending	
			var updateCompletedChallenges = {};
			if(completeDailyChallenges && completeDailyChallenges.length >= 0)
			{
				// Just append to End
				completeDailyChallenges.push(newCompletedChallengeInfo);				
			}			
			// Updating History
			updateCompletedChallenges[_DailyChallengesCompletedKey] = JSON.stringify(completeDailyChallenges);
			
			server.UpdateUserReadOnlyData(  {
				PlayFabId: playerId,
				Data: updateCompletedChallenges
				});	
		}
		else
		{
			// Need to create New Entry
			var updateCompletedChallenges = {};
			var firstChallengeInfo = [ newCompletedChallengeInfo ];
			updateCompletedChallenges[_DailyChallengesCompletedKey] = JSON.stringify(firstChallengeInfo);
			
			// Need to Setup Entry
			server.UpdateUserReadOnlyData(  {
				PlayFabId: playerId,
				Data: updateCompletedChallenges
				});				
		}
		
		//==============================================================================================================================
		// Update Challenge which we have Just Claimed
		//==============================================================================================================================
		var updateChallengesData = [];
		// All Challenges and Blade
		for(var j=0; j<4; j++)
		{
			// Was it this Challenge We Claimed?
			if ( j == pendingclaimChallengeIndex )
			{
				// Challenge Which Needs Updating
				var updatedChallengeInfo = dailyChallengesParsed[j];
				
				// Set Claimed and Claim Time
				var now = new Date();		// Date
				var currtime = now.getTime(); // miliseconds
				updatedChallengeInfo.Claimed = true;
				updatedChallengeInfo.ClaimTime = currtime;
				
				// Mark for Next Day unlook
				refreshtime = GenerateChallengeNextRefreshTime(); // miliseconds
				updatedChallengeInfo.Active = false;
				updatedChallengeInfo.RefreshDate = refreshtime;			
				
				// Use updated challenge
				updateChallengesData.push(updatedChallengeInfo);
			}
			else
			{
				// Use Exiting Challenge with Updated flag changed
				var unchangedChallengeInfo = dailyChallengesParsed[j];
				unchangedChallengeInfo["Updated"] = currtime;
				updateChallengesData.push(unchangedChallengeInfo);
			}
		}
	
		// Write it back into the player Data
		// log.info("ClaimDailyChallengeReward : Write - FULL- updateChallengesData : " + JSON.stringify(updateChallengesData));
		var updateDailyChallengesInternalData = {};
		updateDailyChallengesInternalData[_DailyChallengesKey] = JSON.stringify(updateChallengesData);
		server.UpdateUserReadOnlyData(
		{
			PlayFabId: playerId,
			Data: updateDailyChallengesInternalData
		});	

		//==============================================================================================================================
		// Now Refresh the slot
		//==============================================================================================================================
		var bClaimChallenge = true;
		var refreshedChallenges = RefreshDailyChallengesByIdAndUpdateBlade(args, bClaimChallenge);
		return refreshedChallenges;
	}

	return {};
}

// ReRoll Daily Challenges
function ReRollDailyChallengesById(args)
{
	// Extract the Challenge Id
    var playerId = args.PlayerUID;
	var challengeId = args.ChallengeId;

	// log.info("ReRollDailyChallengesById : playerId : " + playerId +  " challengeId : " + challengeId);

	// Check Daily Challenges valid
	var dailyChallengesParsed = CheckDailyChallengeDataVersion(playerId);
	
	// Read existing Challenges Id - Indices
	var existingChallengeIndex = [ -1, -1, -1]; // So when we roll a new one its not duplicated/ 
	// Extract existing Selection
	for(var i=0; i<3; i++)
	{
		// pull out challenge Id and convert to index
		var challengeInfo = dailyChallengesParsed[i];
		existingChallengeIndex[i] = challengeInfo.Challenge;
	}

	//==============================================================================================================================
	// Only Non Completed Challenges Can be re-rolled.
	//==============================================================================================================================
	var updateChallengeIndex = [ -1, -1, -1];
	var needToRefreshAnySlots = 0;
	var dailyChallengesRollover = GetDailyChallengeRollover(playerId);
	for(var index=0; index<3; index++)
	{
		// Check if Challenge completed
		var challengeInfo = dailyChallengesParsed[index];

		// Only Reroll 
		if ( challengeInfo.Completed == false && challengeInfo.Challenge == challengeId  && dailyChallengesRollover > 0)
		{
			// Looks like we have more work to do.	
			needToRefreshAnySlots++;
		}
		else
		{
			// No operation needed on this challenge
			updateChallengeIndex[index] = challengeInfo.Challenge;	
		}
	}

	//==============================================================================================================================
	// Display Existing List
	//==============================================================================================================================
	for(var k=0; k<3; k++)
	{
		// log.info("ReRollDailyChallengesById [" + k + "]: [" + existingChallengeIndex[k] +  " : " + updateChallengeIndex[k] + "]");
	}
	
	//==============================================================================================================================
	// Generate new Challenges for any completed challenge
	//==============================================================================================================================
	// log.info("ReRollDailyChallengesById : needToRefreshAnySlots : " +  needToRefreshAnySlots);
	if ( needToRefreshAnySlots > 0)
	{
		// calculate new challenge to replace completed
		for(var updateSlot=0; updateSlot < needToRefreshAnySlots; updateSlot++)
		{
			// Next slot to update
			for(var k=0; k<=3; k++)
			{
				// Find slot that needs updating.
				if (updateChallengeIndex[k] == -1)
				{
					// Check if next Challenge needs to Random/Fixed
					// Lets Generate new Challenge
					var alreadUsedIndex = false;
					do
					{
						// Get next Challenge Index 1-15
						var randNum = Math.floor((Math.random() * 15));
						
						// Check if index is unique?
						alreadUsedIndex = false;
						for(var l=0; l<=3; l++)
						{
							if ( randNum == existingChallengeIndex[l] )
							{
								// already exits
								alreadUsedIndex = true;
							}
						}
						
						// Can we use new number?
						if (!alreadUsedIndex)
						{
							// Save 
							updateChallengeIndex[k] = randNum;
							index++
						}
					}
					while ( alreadUsedIndex);
				}
			}					
		}
	}

	//==============================================================================================================================
	// Display New List
	//==============================================================================================================================
	for(var k=0; k<3; k++)
	{
		// log.info("ReRollDailyChallengesById : REROLL : [" + k + "]: [" + existingChallengeIndex[k] +  " : " + updateChallengeIndex[k] + "]");
	}

	//==============================================================================================================================
	// Generate new List
	//==============================================================================================================================
	// log.info("ReRollDailyChallengesById : needToRefreshAnySlots : " + needToRefreshAnySlots );

	// List of Challenges
	var ChallengeTemplates = server.GetTitleInternalData({Keys:["Challenges"]});
	var challenges = ChallengeTemplates.Data["Challenges"];
	var parsedChallenges = JSON.parse(challenges);
	if (needToRefreshAnySlots )
	{
		// REBUILD THE CHALLENGE LIST OBJECT
		// Add Daily Challenges
		var updateChallengesData = [];
		for(var j=0; j<3; j++)
		{
			// Check if we have new Challenge?
			if (  existingChallengeIndex[j] != updateChallengeIndex[j] )
			{
				// New Challenge
				var index = updateChallengeIndex[j];
				var offset = index-1;
				if ( offset < 0 )
					offset = 0;
				var challengeInfo = parsedChallenges[offset];
				
				// Setup Created and Modified timestamps
				var now = new Date();		// Date
				var time = now.getTime(); // miliseconds
				challengeInfo["Created"] = time;
				challengeInfo["Modified"] = time;
				
				// Re-Roll, Automatically enable
				challengeInfo["Active"] = true;
			
				//Setting the refresh date
				challengeInfo["RefreshDate"] = 0;
		
				// Add Challenge
				updateChallengesData.push(challengeInfo);
				
				// Decrement RollOver
				DecrementDailyChallengeRollover(playerId);
			}
			else
			{
				// Use Exiting Challenge
				var challengeInfo = dailyChallengesParsed[j];
				updateChallengesData.push(challengeInfo);
			}
		}
	
		// Add Blade Challenge
		var bladeChallenge = dailyChallengesParsed[3];
		updateChallengesData.push(bladeChallenge);
		// log.info("ReRollDailyChallengesById : updateChallengesData : " + JSON.stringify(updateChallengesData));
		
		// Write it back into the player
		// Need to Update Daily Challenges On the player data
		var updateDailyChallengesInternalData = {};
		updateDailyChallengesInternalData[_DailyChallengesKey] = JSON.stringify(updateChallengesData);
		
		server.UpdateUserReadOnlyData(
		{
			PlayFabId: playerId,
			Data: updateDailyChallengesInternalData
		});	

		// // Read new generated Challenges
		var dailyChallengesRollover = GetDailyChallengeRollover(playerId);
		var activeDailyChallenges =
		{
			DailyChallenges : updateChallengesData,
			DailyRollOver : dailyChallengesRollover
		};
		// log.info("ReRollDailyChallengesById : activeDailyChallenges : " + JSON.stringify(activeDailyChallenges));
		return activeDailyChallenges;		
	}

	// Get New Generated List
	return GetDailyChallenges(playerId);
}

/*
function GetVehicleMasteryStatsAndReward(args)
{
	var titledata = server.GetTitleData({Keys:["MasteryVehicleRewards"]});
	var masteryLevels = JSON.parse(titledata.Data["MasteryVehicleRewards"]);
		
   
	var result = server.GetAllUsersCharacters({PlayFabId:args.PlayerUID}); // >>>> Playfab Server Call <<<<
	if(result.Characters)
	{		
		log.info("Got All Characters" + result.Characters.length);
		var masteryLevels = JSON.parse(titledata.Data["MasteryVehicleRewards"]);

	}
	return 0;
}*/


// Get Current Daily Challenges
handlers.onGetDailyChallenges = function(args)
{
    var argsJSon = JSON.parse(args);
	var playerId = argsJSon.PlayerUID;
    return GetDailyChallenges(playerId);
}
handlers.onDailyChallengesGetLatest = function(args)
{
    var argsJSon = JSON.parse(args);
	var playerId = argsJSon.PlayerUID;
    return GetDailyChallenges(playerId);
}

// Refresh Daily Challenges
handlers.onDailyChallengesRefresh = function(args)
{
    var argsJSon = JSON.parse(args);
    return RefreshDailyChallengesById(argsJSon);
}

// Generate Random Daily Challenges
handlers.onDailyChallengesGenerateRandom = function(args)
{
    var argsJSon = JSON.parse(args);
	var playerId = argsJSon.PlayerUID;
    return GenerateRandomDailyChallenges(playerId);
}

handlers.onDailyChallengesGenerateFixed = function(args)
{
    var argsJSon = JSON.parse(args);
	var playerId = argsJSon.PlayerUID;
    return GenerateFixedDailyChallenges(playerId);
}

// Claim Challenge Awards
handlers.onClaimDailyChallengeReward = function(args)
{
    var argsJSon = JSON.parse(args);
	return ClaimDailyChallengeReward(argsJSon);
}

handlers.onDailyChallengeClaimReward = function(args)
{
    var argsJSon = JSON.parse(args);
    return ClaimDailyChallengeReward(argsJSon);
}

// Reroll Challenge
handlers.onReRollDailyChallenge = function(args)
{
    var argsJSon = JSON.parse(args);
	return ReRollDailyChallengesById(argsJSon);
}

handlers.onDailyChallengeReRoll = function(args)
{
    var argsJSon = JSON.parse(args);
    return ReRollDailyChallengesById(argsJSon);
}
