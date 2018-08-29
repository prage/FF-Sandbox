
function GrantUserFoundersPack()
{
	var data =  server.GetUserInventory({PlayFabId: currentPlayerId}) ;
	var hasFoundersPack = false;
	
	for(var Index=0;Index < data.Inventory.length; Index++)
    {
    	var userItem = data.Inventory[Index];
		
		if (userItem.ItemId == "SBFP01")
		{			
			log.info("User Already has the founders pack");	
			hasFoundersPack = true;
		}
	}	
	
	if(hasFoundersPack == false)
	{
		log.info("Granting Founders Pack to the user");		
		server.GrantItemsToUser({PlayFabId:currentPlayerId, ItemIds:["SBFP01"], Annotation:"FoundersPack Granted to user for STEAM"});
	}
	return {};
}


function CheckForFoundersPack()
{
	var data =  server.GetUserInventory({PlayFabId: currentPlayerId}) ;
	
	for(var Index=0;Index < data.Inventory.length; Index++)
    {
    	var userItem = data.Inventory[Index];
		
		if (userItem.ItemId == "SBFP01")
		{
			log.info("User Has Founders Pack");				
			
			var catdata = server.GetCatalogItems({});
			
			for(var catty =0; catty<catdata.Catalog.length; catty++)
			{
				var item = catdata.Catalog[catty];				
				
				if(item.ItemId == "SBFP01")
				{		
					log.info("Found Catalog item SBFP01");
				
					for(var buIt =0; buIt <item.Bundle.BundledItems.length; buIt++)
					{
						var FoundersPackItem = item.Bundle.BundledItems[buIt];
						var foundItem = false;
												
						// Loop through players inventory to see if FoundersPackItem exists in the players inventory
						for(var inv=0;inv < data.Inventory.length; inv++)
						{
							var userInvItem = data.Inventory[inv];
		
							if (userInvItem.ItemId == FoundersPackItem)
							{
								foundItem = true;
							}							
						}
						
						if(foundItem == false)
						{
							var ret = server.GrantItemsToUser({PlayFabId:currentPlayerId, ItemIds:[FoundersPackItem], Annotation:"FoundersPack Retroactivation"});
							
							log.info("Granting a new item to the user that came from the updated founders pack " + FoundersPackItem);
						}						
					}
				}
			}
		}
	}
    return {};
}

		 
handlers.onGrantUsersFoundersPack = function(args)
{
    return GrantUserFoundersPack();
}
handlers.onCheckForFoundersPack = function(args)
{
    return CheckForFoundersPack();
}	
