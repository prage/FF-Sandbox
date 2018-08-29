// Set RefreshDate
function DebugGenerateChallengeNextRefreshTime()
{
	// Set time for 1 min past
	var refreshtime = new Date();
	var hours = refreshtime.getHours();
	var mins = refreshtime.getMinutes();
	if ( mins == 59)
	{
		var nhours = hours+1;
		refreshtime.setHours(nhours);
		refreshtime.setMinutes(2);
		// log.info("DebugGenerateChallengeNextRefreshTime : nhours : " + hours + ":" + nhours);
	}
	else
	{
		var nmins = mins+2;
		refreshtime.setMinutes(nmins);
		// log.info("DebugGenerateChallengeNextRefreshTime : nmins : " + mins +  ":" + nmins);
	}
	refreshtime.setMilliseconds(999);
	var nextrefresh = refreshtime.getTime();

	// Calculate Current Time in MS
	var currtime = new Date();
	var currtimeinms = currtime.getTime();
	// log.info("DebugGenerateChallengeNextRefreshTime : timems : " + currtimeinms + " timeNextRefresh : " + nextrefresh +  " Diff : " + (nextrefresh-currtimeinms));
	return nextrefresh;
}

// Can only claim one challenge at a time.
function DebugClaimDailyChallengeReward(args)
{   
	// Extract the Challenge Id
    var playerId = args.PlayerUID;
	var challengeId = args.ChallengeId;
	
	// Check Compulsory Params
	if ( args.PlayerUID )
	{
		playerId = args.PlayerUID;
		// log.info("DebugClaimDailyChallengeReward : SET : playerId : " + playerId);
	}
	if ( args.ChallengeId )
	{
		challengeId = args.ChallengeId;
		// log.info("DebugClaimDailyChallengeReward : SET : challengeId : " + challengeId);
	}

	log.info("DebugClaimDailyChallengeReward : playerId : " + playerId +  " challengeId : " + challengeId);
	
	//==========================================================================================================================================================================
	// Read existing Challenges
	//==========================================================================================================================================================================
	//var validChallengeVersion = false;
    var existingDailyChallenges = server.GetUserReadOnlyData({PlayFabId: playerId, Keys: [_DailyChallengesKey]});
	
	// Parse current Challenges
	var dailyChallengesParsed = JSON.parse(existingDailyChallenges.Data[_DailyChallengesKey].Value);
	
	//==========================================================================================================================================================================
	// Check and see if Challenge is Completed and Not Claimed
	//==========================================================================================================================================================================
	var pendingclaimChallengeIndex = -1;
	
	for(var index=0; index<3; index++)
	{
		// Check if Challenge completed
		var challengeInfo = dailyChallengesParsed[index];
		// log.info("DebugClaimDailyChallengeReward : [" + index + "] challengeId : " + challengeInfo.Challenge + " Completed : " + challengeInfo.Completed);
		if (challengeInfo.Challenge == challengeId && challengeInfo.Completed && (challengeInfo.Claimed == false))
		{
			// Looks like we have more work to do.
			pendingclaimChallengeIndex = index;
		}		
	}
	
	//==============================================================================================================================
	// Award the claim. 
	//==========================================================================================================================================================================
	log.info("DebugClaimDailyChallengeReward : pendingclaimChallengeIndex : " + pendingclaimChallengeIndex);
	if (pendingclaimChallengeIndex != -1)
	{
		var challengeInfo = dailyChallengesParsed[pendingclaimChallengeIndex];
		var BC = challengeInfo.RewardBC;
		var BP = challengeInfo.RewardBP;
		
		// Storage for Sending new Amounts
		if(BC>0)
		{
			log.info("DebugClaimDailyChallengeReward : Award Virtual BC : " + BC);
			server.AddUserVirtualCurrency(
			{
				PlayFabId: playerId,
				VirtualCurrency: "BC",
				Amount: BC
			});
		}
		if(BP>0)
		{
			log.info("DebugClaimDailyChallengeReward : Award Virtual BP : " + BP);
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
		// Now Refresh the slot
		//==============================================================================================================================
/*		
		var bClaimChallenge = true;
		var refreshedChallenges = DebugRefreshDailyChallengesById(args, bClaimChallenge);
		return refreshedChallenges;
*/		
	}
	return {};
}


// Refresh Daily Challenges
// If there are no challenges then generate some
// Generate new challenge when its completed and claimed.
// function DebugRefreshDailyChallengesById(args, bClaimedChallenge)
function DebugRefreshDailyChallengesById(args)
{
	// Extract the Challenge Id
    var playerId = args.PlayerUID;
	var challengeId = args.ChallengeId;
	log.info("DebugRefreshDailyChallengesById : playerId : " + playerId +  " challengeId : " + challengeId);

	// Parse dailyChallenges
    var existingDailyChallenges = server.GetUserReadOnlyData({PlayFabId: playerId, Keys: [_DailyChallengesKey]});
	var dailyChallengesParsed = JSON.parse(existingDailyChallenges.Data[_DailyChallengesKey].Value);
	
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
	var maxChallengeId = -1;
	for(var index=0; index<3; index++)
	{
		// Check if Challenge completed
		var challengeInfo = dailyChallengesParsed[index];
	
		if ( challengeInfo.Completed && challengeInfo.Challenge == challengeId )
		{
			// Looks like we have more work to do.	
			needToRefreshAnySlots++;
		}
		else
		{
			// No operation needed on this challenge
			updateChallengeIndex[index] = challengeInfo.Challenge;	
		}
		
		// Check Max
		if ( challengeInfo.Challenge > maxChallengeId)
		{
			maxChallengeId = challengeInfo.Challenge;
		}
	}
	// Next Free Slot
	maxChallengeId++; 
	if ( maxChallengeId > 15)
	{
		maxChallengeId = maxChallengeId - 15;
	}
	
	//==============================================================================================================================
	// Display Existing List
	//==============================================================================================================================
	for(var k=0; k<3; k++)
	{
		// log.info("DebugRefreshDailyChallengesById [" + k + "]: [" + existingChallengeIndex[k] +  " : " + updateChallengeIndex[k] + "]");
	}

	//==============================================================================================================================
	// Generate new Challenges for any completed challenge
	//==============================================================================================================================
	log.info("DebugRefreshDailyChallengesById : maxChallengeId : " + maxChallengeId + " needToRefreshAnySlots : " +  needToRefreshAnySlots);
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
					// Used Fixed Order
					updateChallengeIndex[k] = maxChallengeId;
					maxChallengeId++;
				}
			}					
		}
	}

	//==============================================================================================================================
	// Display New List
	//==============================================================================================================================
	for(var k=0; k<3; k++)
	{
		// log.info("DebugRefreshDailyChallengesById : REFRESH :  [" + k + "]: [" + existingChallengeIndex[k] +  " : " + updateChallengeIndex[k] + "]");
	}

	//==============================================================================================================================
	// Generate new List
	//==============================================================================================================================
	log.info("DebugRefreshDailyChallengesById : needToRefreshAnySlots : " + needToRefreshAnySlots );

	// List of Challenges
	var ChallengeTemplates = server.GetTitleInternalData({Keys:["Challenges"]});
	var challenges = ChallengeTemplates.Data["Challenges"];
	var parsedChallenges = JSON.parse(challenges);
	if (needToRefreshAnySlots )
	{
		// Used Fixed Sequence Updates
		var updateChallengesData = {};
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
				challengeInfo.Created = time;
				challengeInfo.Modified = time;
				challengeInfo.Updated = time;
				
				// Mark for Next Day unlook
				challengeInfo.Active = false;
				challengeInfo.RefreshDate = DebugGenerateChallengeNextRefreshTime();

				// Add Challenge
				updateChallengesData = challengeInfo;
				
				// Just Return New Entry
				log.info("DebugRefreshDailyChallengesById : updateChallengesData : " + JSON.stringify(updateChallengesData));
				return updateChallengesData;
			}
		}
	}
	
	// Get New Generated List
	return GetDailyChallenges(playerId);
}

// Debug Challenge Update
function DebugChallengeUpdate(args)
{   
	// Display Passed in Parms
	log.info("DebugChallengeUpdate : args : " + JSON.stringify(args));
    var playerId = currentPlayerId;
	var challengeId = -1;
	var challengeProgress = 0;
	var challengeComplete = false;
	var challengeReset =  false;
	var challengeSequenceFixed = false;
	var challengeSequenceRandom = false;
	var challengeClaim =  false;
	var challengeRefresh =  false;
	var challengeReRoll =  false;
	var challengeTimeout =  false;
	
	// Check Compulsory Params
	if ( args.PlayerUID )
	{
		playerId = args.PlayerUID;
		// log.info("DebugChallengeUpdate : SET : playerId : " + playerId);
	}
	if ( args.ChallengeId )
	{
		challengeId = args.ChallengeId;
		// log.info("DebugChallengeUpdate : SET : challengeId : " + challengeId);
	}
	if (args.Sequence == true)
	{
		challengeSequenceFixed = args.Sequence;
		challengeId = -2;
		// log.info("DebugChallengeUpdate : SET : challengeSequenceFixed : " + challengeSequenceFixed);
	}

	if (args.Random == true)
	{
		challengeSequenceRandom = args.Random;
		challengeId = -2;
		// log.info("DebugChallengeUpdate : SET : challengeSequenceRandom : " + challengeSequenceRandom);
	}

	// Check Params
	if (args.Progress > 0)
	{
		challengeProgress = args.Progress;
		// log.info("DebugChallengeUpdate : SET : challengeProgress : " + challengeProgress);
	}
	if (args.Complete == true)
	{
		challengeComplete = args.Complete;
		// log.info("DebugChallengeUpdate : SET : challengeComplete : " + challengeComplete);
	}
	if (args.Reset == true)
	{
		challengeReset = args.Reset;
		// log.info("DebugChallengeUpdate : SET : challengeReset : " + challengeReset);
	}

	if (args.Claim == true)
	{
		challengeClaim = args.Claim;
		// log.info("DebugChallengeUpdate : SET : challengeClaim : " + challengeClaim);
	}
	
	if (args.Refresh == true)
	{
		challengeRefresh = args.Refresh;
		// log.info("DebugChallengeUpdate : SET : challengeRefresh : " + challengeRefresh);
	}
	
	if (args.ReRoll == true)
	{
		challengeReRoll = args.ReRoll;
		// log.info("DebugChallengeUpdate : SET : challengeReRoll : " + challengeReRoll);
	}
	
	if (args.Timeout == true)
	{
		challengeTimeout = args.Timeout;
		// log.info("DebugChallengeUpdate : SET : challengeTimeout : " + challengeTimeout);
	}
	
	// Check for Sequence command
	// log.info("DebugChallengeUpdate : SEQUENCE : challengeId : " + challengeId);
	if ( (challengeSequenceFixed == true || challengeSequenceRandom == true) && (challengeId == -2))
	{
		// Return Early... Nothing to 
		// log.info("DebugChallengeUpdate : SEQUENCE : challengeId : " + challengeId);
		
		// Generate Fixed List
		if ( challengeSequenceFixed == true)
		{
			// log.info("DebugChallengeUpdate : SEQUENCE : challengeId : " + challengeId);
			return GenerateFixedDailyChallenges(playerId);
		}
		else if ( challengeSequenceRandom == true)
		{
			// Random
			// log.info("DebugChallengeUpdate : RANDOM : challengeId : " + challengeId);
			return GenerateRandomDailyChallenges(playerId);
		}
	}
	
	//==========================================================================================================================================================================
	// Read existing Challenges
	//==============================================================================================================================
	// log.info("DebugChallengeUpdate : playerId : " + playerId);
    var existingDailyChallenges = server.GetUserReadOnlyData({PlayFabId: playerId, Keys: [_DailyChallengesKey]});
	
	// Parse current Challenges
	var dailyChallengesParsed = JSON.parse(existingDailyChallenges.Data[_DailyChallengesKey].Value);
	
	//==========================================================================================================================================================================
	// Check and see if Challenge is Completed and Not Claimed
	//==============================================================================================================================
	var validChallengeIndex = -1;
	// log.info("DebugChallengeUpdate : challengeId : " + challengeId);
	for(var index=0; index<4; index++)
	{
		// Check if Challenge completed
		var challengeInfo = dailyChallengesParsed[index];
		
		// log.info("DebugChallengeUpdate : [" + index + "] challengeName : " + challengeInfo.Name + " challengeId : " + challengeInfo.Challenge);
		if (challengeInfo.Challenge == challengeId)
		{
			// Looks like we have more work to do.
			// log.info("DebugChallengeUpdate : FOUND : index : " + index);
			validChallengeIndex = index;
		}		
	}

	//==============================================================================================================================
	// Update Challenge. 
	//==============================================================================================================================
	log.info("DebugChallengeUpdate : validChallengeIndex : " + validChallengeIndex);
	if (validChallengeIndex != -1)
	{
		// Challenge to apply updates 
		var updatedChallengeInfo = dailyChallengesParsed[validChallengeIndex];

		// Setup link to Blade Challenge
		var bBladeUpdated = false;
		var bladeChallenge = dailyChallengesParsed[3];
		
		// Get CurrentTime
		var now = new Date();		// Date
		var currtime = now.getTime(); // miliseconds
		var bModifyFlag = false;
		var bUpdateFlag = false;
		
		// Check Progress flag
		if ( challengeProgress > 0 )
		{
			log.info("DebugChallengeUpdate : Progress : " + challengeProgress);
			updatedChallengeInfo.Progress = updatedChallengeInfo.Progress + challengeProgress;
			
			// Check if Challenge Completed?
			if ( updatedChallengeInfo.Progress >= updatedChallengeInfo.Target)
			{
				// Update Challenge Info
				updatedChallengeInfo.Completed = true;
				updatedChallengeInfo.Progress = updatedChallengeInfo.Target
				updatedChallengeInfo.CompletedTime = currtime;
			}
			
			// Change Modify Flag
			bModifyFlag = true;
			bUpdateFlag = true;
		}
		
		// Check Completed flag
		if ( challengeComplete == true )
		{
			log.info("DebugChallengeUpdate : Complete : ");
			updatedChallengeInfo.Completed = true;
			
			// Update Progress Counter
			updatedChallengeInfo.Progress = updatedChallengeInfo.Target;
			updatedChallengeInfo.CompletedTime = currtime;
			
			// Change Modify Flag
			bModifyFlag = true;
			bUpdateFlag = true;
		}
		
		// Check Claimed flag
		if ( challengeClaim == true )
		{
			log.info("DebugChallengeUpdate : Claimed : " +  updatedChallengeInfo.Claimed);

			// Lets Attempt to Claim 
			if ( updatedChallengeInfo.Claimed == false && updatedChallengeInfo.Completed == true)
			{
				// Check if Challenge or Blade
				if ( updatedChallengeInfo.Challenge == 16 )
				{
					// Blade challenge has changed as well
					bBladeUpdated = true;
				}
				else
				{
					// Normal Changes
					var claimDailyChallengesData = {};
					claimDailyChallengesData["PlayerUID"] = playerId;
					claimDailyChallengesData["ChallengeId"] = challengeId;
					// log.info("DebugChallengeUpdate : claimDailyChallengesData : " + JSON.stringify(claimDailyChallengesData));
					var argsJSon = claimDailyChallengesData;
					DebugClaimDailyChallengeReward(argsJSon);
					
					// Set Claimed Flag
					// Update Claimed Timestamp
					updatedChallengeInfo.Claimed = true;
					updatedChallengeInfo.ClaimTime = currtime;
					
					// Set Timer to next Refresh
					updatedChallengeInfo.Active = false;
					updatedChallengeInfo.RefreshDate = DebugGenerateChallengeNextRefreshTime();			
					
					// Blade challenge has changed as well
					bBladeUpdated = true;
					
					// Change Modify Flag
					bModifyFlag = true;
					bUpdateFlag = true;
				}
			}
		}
		
		// Check Refresh flag
		if ( challengeRefresh == true )
		{
			log.info("DebugChallengeUpdate : Refresh : ");
			// Lets Attempt to Refresh 
			if ( updatedChallengeInfo.Claimed == true && updatedChallengeInfo.Completed == true)
			{
				// Lets Attempt to Refresh Challenge
				var refreshDailyChallengesData = {};
				refreshDailyChallengesData["PlayerUID"] = playerId;
				refreshDailyChallengesData["ChallengeId"] = challengeId;
				log.info("DebugChallengeUpdate : refreshDailyChallengesData : " + JSON.stringify(refreshDailyChallengesData));
				var refreshChallenge = DebugRefreshDailyChallengesById(refreshDailyChallengesData);
				
				// Update UpdatedChallengeInfo
				updatedChallengeInfo = refreshChallenge;

				// Change Modify Flag
				bModifyFlag = true;
				bUpdateFlag = true;
			}
		}
		
		// Check Reroll flag
		if ( challengeReRoll == true )
		{
			log.info("DebugChallengeUpdate : challengeReRoll : ");
			// Lets Attempt to ReRoll 
			var dailyChallengesRollover = GetDailyChallengeRollover(playerId);
			if ( updatedChallengeInfo.Claimed == false && updatedChallengeInfo.Completed == false && updatedChallengeInfo.Progress == 0 && dailyChallengesRollover > 0)
			{
				// Lets Attempt to Refresh Challenge
				var rerollDailyChallengesData = {};
				rerollDailyChallengesData["PlayerUID"] = playerId;
				rerollDailyChallengesData["ChallengeId"] = challengeId;
				log.info("DebugChallengeUpdate : rerollDailyChallengesData : " + JSON.stringify(rerollDailyChallengesData));
				var ClaimChallenge = false;
				var rerollChallenge = DebugReRollDailyChallengesById(rerollDailyChallengesData, ClaimChallenge);
				
				// Update UpdatedChallengeInfo
				updatedChallengeInfo = rerollChallenge;

				// Change Modify Flag
				bModifyFlag = true;
				bUpdateFlag = true;
			}
		}
		
		// Check Reset flag
		if ( challengeReset == true )
		{
			log.info("DebugChallengeUpdate : Reset : ");
			updatedChallengeInfo.Completed = false;
			updatedChallengeInfo.Claimed = false;
			updatedChallengeInfo.Progress = 0;
			
			// Reset Time
			updatedChallengeInfo.Active = true;
			updatedChallengeInfo.RefreshDate = 0;
			updatedChallengeInfo.ClaimTime = 0;
			updatedChallengeInfo.CompletedTime = 0;
			
			// Change Modify Flag
			bModifyFlag = true;
			bUpdateFlag = true;
		}

		// Check Timeout Flag
		if ( challengeTimeout == true )
		{
			log.info("DebugChallengeUpdate : Timeout : ");
			if ( updatedChallengeInfo.RefreshDate > 0)
			{
				// Change Active Flag
				updatedChallengeInfo.RefreshDate = 0;
				updatedChallengeInfo.Active = true;
				
				// Change Modify Flag
				bModifyFlag = true;
				bUpdateFlag = true;
			}
		}
		
		// Update Modified timestamp
		if (bModifyFlag == true)
		{
			updatedChallengeInfo["Modified"] = currtime;
			// log.info("DebugChallengeUpdate : bModifyFlag @ " + currtime);
		}
		if (bUpdateFlag == true)
		{
			updatedChallengeInfo["Updated"] = currtime;
			// log.info("DebugChallengeUpdate : bUpdateFlag @ " + currtime);
		}
		
		//==============================================================================================================================
		// Refresh Challenge List
		//==============================================================================================================================
		var updateChallengesData = [];
		// All Challenges and Blade
		for(var j=0; j<4; j++)
		{
			// Check if its challenge we need to updawe have new Challenge?
			if ( j == validChallengeIndex )
			{
				// Use updated challenge
				updateChallengesData.push(updatedChallengeInfo);
			}
			else
			{
				// Use Exiting Challenge with Updated flag changed
				var challengeInfo = dailyChallengesParsed[j];
				challengeInfo["Updated"] = currtime;
				updateChallengesData.push(challengeInfo);
			}
		}
	
		// Check if Blade Challenge needs updating
		// log.info("DebugChallengeUpdate : bBladeUpdated " + bBladeUpdated + " - PRE- updateChallengesData : " + JSON.stringify(updateChallengesData));
		if (bBladeUpdated == true)
		{
			var bBladeModifyFlag = false;
			var bBladeUpdateFlag = false;
			
			// NOTE : Update Blade challenges
			if ( updatedChallengeInfo.Challenge == 16 )
			{
				// Blade Challenge Claim
				if ( bladeChallenge.Progress >= bladeChallenge.Target)
				{
					// Reset Blade challenge
					var titleInternalData = server.GetTitleInternalData({Keys:["Challenges"]});
					var challenges = titleInternalData.Data["Challenges"];
					var parsedChallenges = JSON.parse(challenges);
					
					// Blade Challenge
					bladeChallenge = parsedChallenges[15];
					
					// Reset Creation time
					bladeChallenge.Created = currtime;
					bladeChallenge.Modified = currtime;
					bladeChallenge.Updated = currtime;
					
					// Reset associated fields
					bladeChallenge.Active = true;
					bladeChallenge.RefreshDate = 0;
					bladeChallenge.ClaimTime = 0;
					bladeChallenge.CompletedTime = 0;
				}
			}
			else
			{
				// Normal Challenge just update Blade Count
				bladeChallenge.Progress = bladeChallenge.Progress + 1;
				if ( bladeChallenge.Progress >= bladeChallenge.Target)
				{
					// Set Blade Completed Challenge as well
					bladeChallenge.Completed = true;
					bladeChallenge.Progress = bladeChallenge.Target;
				}
				
				// Modified
				bBladeModifyFlag = true;
			}
			
			// Update Modified timestamp
			if (bBladeModifyFlag)
			{
				bladeChallenge["Modified"] = currtime;
			}
			if (bBladeUpdateFlag)
			{
				bladeChallenge["Updated"] = currtime;
			}				
			
			// Use Modified Blade Challenge
			updateChallengesData.push(bladeChallenge);
		}
	
		// Write it back into the player
		// log.info("DebugChallengeUpdate : Write - FULL- updateChallengesData : " + JSON.stringify(updateChallengesData));
		// Need to Update Daily Challenges On the player data
		var updateDailyChallengesInternalData = {};
		updateDailyChallengesInternalData[_DailyChallengesKey] = JSON.stringify(updateChallengesData);
		server.UpdateUserReadOnlyData(
		{
			PlayFabId: playerId,
			Data: updateDailyChallengesInternalData
		});	
		
		// // Read new generated Challenges
		// Send Back updated List
		var dailyChallengesRollover = GetDailyChallengeRollover(playerId);
		var activeDailyChallenges =
		{
			DailyChallenges : updateChallengesData,
			DailyRollOver : dailyChallengesRollover
		};
		return activeDailyChallenges;		
	}

	// Get Latest version
	return GetDailyChallenges(playerId);
}

function DebugAddMasteryProgress(args)
{
	var playerId = args.PlayerUID;
	var vehicleType = args.Vehicle;
	var vehicleXP = args.XP;
	
	var titledata = server.GetTitleData({Keys:["MasteryVehicleRewards"]});
	var readOnlyData = server.GetUserReadOnlyData( {PlayFabId: playerId, Keys:["VehicleMasteryProgress"] });
	var masteryLevels = JSON.parse(titledata.Data["MasteryVehicleRewards"]);
	log.info("DebugAddMasteryProgress : playerId " + playerId + " vehicleType : " + vehicleType +  " XP : " + vehicleXP);

	//	Check we have Table to access
	if(readOnlyData.Data["VehicleMasteryProgress"] )
	{			
		var masteryProgressTable = JSON.parse(readOnlyData.Data["VehicleMasteryProgress"].Value);	
		// log.info("DebugAddMasteryProgress : masteryProgressTable " + JSON.stringify(masteryProgressTable));
		for(var i=0; i<masteryProgressTable.length; i++)
		{		
			var XP = masteryProgressTable[i].XP;
			// log.info("DebugAddMasteryProgress : [" + i + "] vehicle : " + masteryProgressTable[i].MasteryVehicle +  " XP : " + masteryProgressTable[i].XP + " Level : " + masteryProgressTable[i].Level);
			var newXP = 0;			
			var outdata = GetMasteryLevel(masteryLevels, XP);
			var currentLvl = outdata.currentLevel;
			if(masteryProgressTable[i].MasteryVehicle == vehicleType )
			{
				newXP = vehicleXP;
				var newLvl = GetMasteryLevel(masteryLevels, newXP);
				masteryProgressTable[i].XP = newXP;
				masteryProgressTable[i].Level = newLvl;
				
				if(currentLvl != newLvl)
				{
					AwardMasteryLevelReward(playerId, masteryLevels, newLvl);
				}					
			}
		}
		
		var outData = {};		
		outData["VehicleMasteryProgress"] = JSON.stringify(masteryProgressTable);
		var updateReadonly = server.UpdateUserReadOnlyData({  // >>>> Playfab Server Call <<<<
								PlayFabId: playerId,
								Data: outData});
	}	
	
	return 0;
}

// ReRoll Daily Challenges
function DebugReRollDailyChallengesById(args)
{
	// Extract the Challenge Id
    var playerId = args.PlayerUID;
	var challengeId = args.ChallengeId;
	log.info("DebugReRollDailyChallengesById : playerId : " + playerId +  " challengeId : " + challengeId + " Random : " + bRandom);

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
	// Only Non Completed Challenges Can be re-rolled.
	//==============================================================================================================================
	var updateChallengeIndex = [ -1, -1, -1];
	var needToRefreshAnySlots = 0;
	var maxChallengeId = -1;
	for(var index=0; index<3; index++)
	{
		// Check if Challenge completed
		var challengeInfo = dailyChallengesParsed[index];

		// Only Reroll 
		if ( challengeInfo.Progress == 0 && challengeInfo.Completed == false && challengeInfo.Challenge == challengeId )
		{
			// Looks like we have more work to do.	
			needToRefreshAnySlots++;
		}
		else
		{
			// No operation needed on this challenge
			updateChallengeIndex[index] = challengeInfo.Challenge;	
		}
		
		// Check Max
		if ( challengeInfo.Challenge > maxChallengeId)
		{
			maxChallengeId = challengeInfo.Challenge;
		}
	}
	// Next Free Slot
	maxChallengeId++; 
	if ( maxChallengeId > 15)
	{
		maxChallengeId = maxChallengeId - 15;
	}
	
	//==============================================================================================================================
	// Display Existing List
	//==============================================================================================================================
	for(var k=0; k<3; k++)
	{
		// log.info("DebugReRollDailyChallengesById [" + k + "]: [" + existingChallengeIndex[k] +  "] : [" + updateChallengeIndex[k] + "]");
	}

	//==============================================================================================================================
	// Generate new Challenges for any completed challenge
	//==============================================================================================================================
	log.info("DebugReRollDailyChallengesById : maxChallengeId : " + maxChallengeId + " needToRefreshAnySlots : " +  needToRefreshAnySlots);
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
					if (bRandom)
					{
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
					else
					{
						// Used Fixed Order
						updateChallengeIndex[k] = maxChallengeId;
						maxChallengeId++;
					}
				}
			}					
		}
	}

	//==============================================================================================================================
	// Display New List
	//==============================================================================================================================
	for(var k=0; k<3; k++)
	{
		// log.info("DebugReRollDailyChallengesById [" + k + "]: [" + existingChallengeIndex[k] +  "] : [" + updateChallengeIndex[k] + "]");
	}
	
	//==============================================================================================================================
	// Generate new List
	//==============================================================================================================================
	log.info("DebugReRollDailyChallengesById : needToRefreshAnySlots : " + needToRefreshAnySlots );

	// List of Challenges
	var ChallengeTemplates = server.GetTitleInternalData({Keys:["Challenges"]});
	var challenges = ChallengeTemplates.Data["Challenges"];
	var parsedChallenges = JSON.parse(challenges);
	if (needToRefreshAnySlots )
	{
		// Check if next Challenge needs to Random/Fixed
		// Just Return One we are updating
		var updateChallengesData = {};
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
				
				// Reroll Challenges are refreshed
				challengeInfo["Active"] = true;
				challengeInfo["RefreshDate"] = 0;
		
				// Add Challenge
				updateChallengesData = challengeInfo;
				
				// Just Return New Entry
				log.info("DebugReRollDailyChallengesById : Fixed Single Entry : " + JSON.stringify(updateChallengesData));
				return updateChallengesData;
			}
		}
	}

	// Get New Generated List
	return GetDailyChallenges(playerId);
}

// Debug DebugTimer Genereator
handlers.onDebugGenerateChallengeNextRefreshTime = function(args)
{
    return DebugGenerateChallengeNextRefreshTime();	
}
// Debug Helper Functions for ReRoll
handlers.onDailyChallengeReRollIncrement = function(args)
{
    var argsJSon = JSON.parse(args);
	var playerId = argsJSon.PlayerUID;
	var rorollCounter = IncrementDailyChallengeRollover(playerId);
	return GetDailyChallenges(playerId);
}
handlers.onDailyChallengeReRollDecrement = function(args)
{
    var argsJSon = JSON.parse(args);
	var playerId = argsJSon.PlayerUID;
	var rorollCounter = DecrementDailyChallengeRollover(playerId);
	return GetDailyChallenges(playerId);
}

// Daily Login ReRoll Counter
handlers.onDebugAddLoginUpdate = function(args)
{
	// Cause Normal Login Action to Work
	DebugAddLoginUpdate();

	// Update Challenges Rollover Count
	var rorollCounter = GetDailyChallengeRollover(currentPlayerId);
	var rerollDailyChallengesData = {};
	rerollDailyChallengesData["DailyRollOver"] = rorollCounter;
	return rerollDailyChallengesData;
}

// Debug Functions Challenges - Progress/Complete/Clear operations
handlers.onDebugChallengeUpdate = function(args)
{
    var argsJSon = JSON.parse(args);
    return DebugChallengeUpdate(argsJSon);	
}
handlers.onDailyChallengeDebugUpdate = function(args)
{
    var argsJSon = JSON.parse(args);
    return DebugChallengeUpdate(argsJSon);	
}

// Debug Mastery 
handlers.onDebugAddMastery = function(args)
{
	var argsJSon = JSON.parse(args);
    return DebugAddMasteryProgress(argsJSon);
}