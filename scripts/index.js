var defaultMasteryPage = {
    name:'Mastery Page',
    masteries:[],
    defaultPage:true
};

var defaultRunePage = {
    name:'Rune Page',
    items:{},
    stats:{},
    defaultPage:true
};

var champStatVariables = [
    'hpregen','mpregen','apen','mpen','lifesteal','spellvamp',
    'crit','tenacity','attackdamage','abilitypower','armor',
    'spellblock','attackspeed','cdr','attackrange','movespeed',
    'hp','mp'
];

var statToVariable = {
    'HP Regen':'hpregen',
    'Mana Regen':'mpregen',
    'Armor Pen':'apen',
    'Magic Pen':'mpen',
    'Life Steal':'lifesteal',
    'Spell Vamp':'spellvamp',
    'Crit Chance':'crit',
    'Tenacity':'tenacity',
    'Attack Damage': 'attackdamage',
    'Ability Power':'abilitypower',
    'Armor':'armor',
    'Magic Resistance':'spellblock',
    'Attack Speed':'attackspeed',
    'Cooldown Reduction':'cdr',
    'Attack Range':'attackrange',
    'Movement Speed':'movespeed',
    'Health':'hp',
    'Mana/Energy':'mp'
};

var stats = Object.keys(statToVariable);

var mastery_stats = {};

$(document).ready(function(){
    var landingRactive = new Ractive({
        el:"#landing",
        template:"#landing-template",
        data:{
            region:"NA",
            masteriesOrder:['Offense', 'Defense', 'Utility'],
            popupWindow: 'none',
            popupActive: false,
            selectedMasteryPage: defaultMasteryPage,
            selectedRunePage: defaultRunePage,
            masteryStats: {},
            runeStats: {},
            baseChampStats: {},
            itemStats: {},
            summonerLoaded: true,
            keybindings:['Q','W','E','R'],
            stats:stats,
            statToVariable:statToVariable,
            championLevel:1
        }
    });
    var key;
    var CHAMPS_PER_ROW = 8;
    var resources = $.getJSON('messages/resources.json');
    var allMasteries = {};
    var allChampions = [];
    var allRunesData = {}; /* static rune data  */
    var modVariables = {};
    var masteryTree = {};

    $.when(resources).done(function(r) {
        key = r.apiKey;
        mastery_stats = r.mastery_stats;
        modVariables = r.stat_english;

        console.log("mastery_stats: ");
        console.log(mastery_stats);
        var url = 'https://global.api.pvp.net/api/lol/static-data/na/v1.2/mastery?api_key=' + key;
        var allMasteriesRequest = $.ajax({
            url: url,
            dataType: 'json',
            type: "GET",
            data:{
                masteryListData:"image,masteryTree,ranks,tree"
            }
        });

        $.when(allMasteriesRequest).done(function(m){
            allMasteries = m.data;
            masteryTree = m.tree;
            var trees = {};
            for(var type in masteryTree){
                var tree = [];
                var rows = masteryTree[type];
                rows.forEach(function(r){
                    var row = [];
                    r.masteryTreeItems.forEach(function(item){
                        if(item){
                            row.push({
                                description: allMasteries[item.masteryId].description,
                                id: allMasteries[item.masteryId].id,
                                image: 'http://ddragon.leagueoflegends.com/cdn/5.21.1/img/mastery/' + allMasteries[item.masteryId].image.full,
                                masteryTree: allMasteries[item.masteryId].masteryTree,
                                name: allMasteries[item.masteryId].name,
                                totalPoints: allMasteries[item.masteryId].ranks,
                                points: 0
                            });
                        } else{
                            row.push(null);
                        }
                    });
                    tree.push(row);
                });
                trees[type] = tree;
            }
            var order = [trees['Offense'], trees['Defense'], trees['Utility']];
            var masteriesReference = {};
            for(var i = 0; i < order.length; i++){
                for (var rowIndex = 0; rowIndex < order[i].length; rowIndex++){
                    for (var colIndex = 0; colIndex < order[i][rowIndex].length; colIndex++){
                        if(order[i][rowIndex][colIndex]){
                            masteriesReference[order[i][rowIndex][colIndex].id] = [i,rowIndex,colIndex];
                        }
                    }
                }
            }
            landingRactive.set('masteriesReference', masteriesReference);
            landingRactive.set('masteryTrees', order);
            landingRactive.set('totalTreePoints', [0, 0, 0]);
        });

        var champsUrl = 'https://global.api.pvp.net/api/lol/static-data/na/v1.2/champion?api_key=' + key;
        var champsRequest = $.ajax({
            url: champsUrl,
            dataType: 'json',
            type: "GET",
            data:{
                champData:"image,stats,passive,spells"
            }
        });

        $.when(champsRequest).done(function(champions){
            for(var key in champions.data){
                allChampions.push({
                    name:champions.data[key].name,
                    image:'http://ddragon.leagueoflegends.com/cdn/5.21.1/img/champion/' + champions.data[key].image.full,
                    spells:champions.data[key].spells,
                    passive:champions.data[key].passive,
                    stats: champions.data[key].stats,
                    title:champions.data[key].title,
                    id:champions.data[key].id
                });
            }
            allChampions.sort(function(a,b){
                return a.name.localeCompare(b.name);
            });

            var champRow = [];
            var rowCount = 0;
            var championDisplay = [];
            allChampions.forEach(function(champ){
                champRow.push(champ);
                rowCount++;
                if(rowCount == CHAMPS_PER_ROW){
                    championDisplay.push(champRow);
                    champRow = [];
                    rowCount = 0;
                }
            });
            championDisplay.push(champRow);
            landingRactive.set('champions', championDisplay);
        });

        var itemsUrl = "https://global.api.pvp.net/api/lol/static-data/na/v1.2/item?itemListData=gold,image,sanitizedDescription,stats,tags&api_key=" + key;
        var itemsRequest = $.ajax({
            url: itemsUrl,
            dataType: 'json',
            type: "GET"
        });

        var allItems = [];
        var ITEM_PER_ROW = 5;

        $.when(itemsRequest).done(function (items){
            for(var item in items.data){
                allItems.push({
                    name:items.data[item].name,
                    id:items.data[item].id,
                    image:'http://ddragon.leagueoflegends.com/cdn/5.21.1/img/item/' + items.data[item].image.full,
                    gold:items.data[item].gold.total,
                    stats:items.data[item].stats,
                    tags: items.data[item].tags,
                    description: items.data[item].sanitizedDescription
                })
            }

            var itemRow = [];
            var rowCount = 0;
            var itemDisplay = [];
            allItems.sort(function(a,b){
                return a.name.localeCompare(b.name);
            });

            allItems.forEach(function(item){
                itemRow.push(item);
                rowCount++;
                if(rowCount == ITEM_PER_ROW){
                    itemDisplay.push(itemRow);
                    itemRow = [];
                    rowCount = 0;
                }
            })
        })
    });

    landingRactive.on('indexTest', function(event, object){
        console.log(object);
    });

    $('#masteryPageDropdown').hide();
    $('#runePageDropdown').hide();
    landingRactive.set('suppressed', false);
    $(document).click(function() {
        if(!landingRactive.get('suppressed')){
            if(landingRactive.get('masteryPageSelectorActive')){
                $('#masteryPageDropdown').hide('blind', 300);
                landingRactive.set('masteryPageSelectorActive', !landingRactive.get('masteryPageSelectorActive'));
            }

            if(landingRactive.get('runePageSelectorActive')){
                $('#runePageDropdown').hide('blind', 300);
                landingRactive.set('runePageSelectorActive', !landingRactive.get('runePageSelectorActive'));
            }
        }
    });

    landingRactive.on('selectRunePage', function(event, runePage){
        if(runePage.defaultPage){
            $('.runePage').tooltip({
                items:"div.runePage",
                position:{
                    my:"right-5 top",
                    at:"left top",
                    collision:"fit"
                },
                content: function(){
                    var element = $(this);
                    if(element.is("div.runePage")){
                        var text = element.attr("id");
                        var temp = text.split('-');
                        var index = temp[1];
                        var runePages = landingRactive.get('runePages');
                        var page = runePages[index];
                        console.log(page);

                        var tooltipContent = '<div><div style="display:inline-block;">';
                        for (var item in page.items){
                            tooltipContent += '<div style="display:inline-block; vertical-align: middle;">'+page.items[item]+'x</div>'
                            tooltipContent += '<div style="display:inline-block; vertical-align: middle; margin-left:10px;"><img width=30 height="30" src="' +
                                'http://ddragon.leagueoflegends.com/cdn/5.21.1/img/rune/' + page.images[item] + '"></div>';
                            tooltipContent += '<div style="font-size:12px;">' + allRunesData[item].name + '</div>';
                            for(var mod in allRunesData[item].stats){
                                var statValue = allRunesData[item].stats[mod];
                                var sign = statValue > 0 ? '+' : '';
                                var description = modVariables[mod];
                                var temp = description.split(' ');
                                if(temp[0] == '%'){
                                    statValue = statValue * 100;
                                }
                                statValue = Math.round(statValue*100)/100;

                                tooltipContent += '<div style="font-size:10px;">(' + sign + statValue + ' ' + description + ')</div>';
                            }
                            tooltipContent += '<br>'
                        }
                        tooltipContent += '</div><div align="left" style="margin-left:20px; vertical-align:top; display:inline-block;"><div style="font-size:20px;">Total Statistics</div>';
                        for(var stat in page.stats){
                            var statValue = page.stats[stat];
                            var sign = statValue > 0 ? '+' : '';
                            var description = modVariables[stat];
                            var temp = description.split(' ');
                            if(temp[0] == '%'){
                                statValue = statValue * 100;
                            }
                            statValue = Math.round(statValue*100)/100;

                            tooltipContent += '<div style="font-size:12px;">' + sign + statValue + ' ' + description + '</div>'
                        }
                        tooltipContent += '</div></div>';

                        return tooltipContent;
                    }
                },
                tooltipClass: "runePage-tooltip"
            });
        }
        else{
            $(".runePage-tooltip").hide();
            $(".runePage").tooltip({
                disable:true,
                hide:true
            });
        }

        landingRactive.set('suppressed', true);
        if(landingRactive.get('masteryPageSelectorActive')){
            $('#masteryPageDropdown').hide('blind', 300);
            landingRactive.set('masteryPageSelectorActive', !landingRactive.get('masteryPageSelectorActive'));
        }
        $('#runePageDropdown').toggle('blind', 300, function() {
            landingRactive.set('runePageSelectorActive', !landingRactive.get('runePageSelectorActive'));
            if (runePage) {
                landingRactive.set('selectedRunePage', runePage);
                // UPDATE CHAMP STATS HERE
                updateStats(landingRactive, true, false, false);
            }
            landingRactive.set('suppressed', false);
        });
    });

    landingRactive.on('selectMasteryPage', function(event, masteryPage){
        //console.log(masteryPage);
        landingRactive.set('suppressed', true);
        if(landingRactive.get('runePageSelectorActive')){
            $('#runePageDropdown').hide('blind', 300);
            landingRactive.set('runePageSelectorActive', !landingRactive.get('runePageSelectorActive'));
        }
        $('#masteryPageDropdown').toggle('blind', 300, function(){
            landingRactive.set('masteryPageSelectorActive', !landingRactive.get('masteryPageSelectorActive'));
            if(masteryPage){
                landingRactive.set('selectedMasteryPage', masteryPage);
                //UPDATE CHAMP STATS HERE
                updateStats(landingRactive, false, true, false);
            }

            landingRactive.set('suppressed', false);
            console.log(masteryPage.masteries);
            if(!landingRactive.get('masteryPageSelectorActive') && masteryPage.masteries.length > 0){
                console.log('update mastery page');
                var reference = landingRactive.get('masteriesReference');
                var update = {};
                var treeTotals = [0,0,0];
                // reset the mastery page
                for(var item in reference){
                    update['masteryTrees.'+reference[item][0]+'.'+reference[item][1]+'.'+reference[item][2]+'.points'] = 0;
                }

                masteryPage.masteries.forEach(function(mastery){
                    var indices = reference[mastery.id];
                    console.log(indices);
                    update['masteryTrees.'+indices[0]+'.'+indices[1]+'.'+indices[2]+'.points'] = mastery.rank;
                    treeTotals[indices[0]]+=mastery.rank;
                });
                landingRactive.set(update);
                landingRactive.set('totalTreePoints', treeTotals);
            }
        });
    });

    landingRactive.on('closePopup', function(){
        closePopup(landingRactive);
    });

    landingRactive.on('showChampSelect', function(){
        openPopup(landingRactive, 'champSelect');
    });

    landingRactive.on('showMasteryPage', function(){
        if(landingRactive.get('selectedMasteryPage').defaultPage){
            return;
        }
        openPopup(landingRactive, 'masteriesPreview');
        $('.mastery').tooltip({
            position: {
                my:"center top+5",
                at:"center bottom"
            },
            items: "[title]",
            content: function(){
                var element = $(this);
                if(element.is("[title]")){
                    var text = element.attr("title");
                    var items = text.split(":");
                    if(items[4] == "null" || items[4] == undefined){
                        element.attr("title", "");
                        return "";
                    }
                    var tooltipContent = '<div style="color:gold; font-size:16px;">' + items[0]+ '</div>';
                    if(items[2] == 0){
                        tooltipContent += '<div style="color:red">' + 'Rank: ' + items[2] + '/' + items[3] + '</div>'
                    } else if (items[2] < items[3]){
                        tooltipContent += '<div style="color:lightgreen">' + 'Rank: ' + items[2] + '/' + items[3] + '</div>'
                    } else if(items[2] == items[3]){
                        tooltipContent += '<div style="color:gold">' + 'Rank: ' + items[2] + '/' + items[3] + '</div>'
                    }
                    tooltipContent += '<br><div>' + items[1] + '</div>'
                    return tooltipContent;
                }
            },
            tooltipClass: "mastery-tooltip"
        });
    });

    landingRactive.on('selectChampion', function(event, champion){
        landingRactive.set('selectedChampion', champion);
        console.log(champion);
        var displayedStats = getBaseStats(champion.stats);
        var baseChampStats = getBaseChampStats(champion.stats);
        landingRactive.set('champStats', displayedStats);
        landingRactive.set('baseChampStats', baseChampStats);

        closePopup(landingRactive);
    });

    landingRactive.on('getSummoner', function(){
        var summoner = landingRactive.get('summonerName');

        landingRactive.set('currentSummoner', summoner);
        landingRactive.set('validCurrentSummoner', true);
        landingRactive.set('summonerLoaded', false);

        var url = 'https://na.api.pvp.net/api/lol/na/v1.4/summoner/by-name/' + summoner + '?api_key=' + key;
        var request = $.ajax({
            url: url,
            dataType: 'json',
            type: "GET",
            error: function(request, status, errorThrown){
                if(errorThrown == 'Not Found'){
                    landingRactive.set('masteryPages', []);
                    landingRactive.set('runePages', []);
                    landingRactive.set('selectedMasteryPage', defaultMasteryPage);
                    landingRactive.set('selectedRunePage', defaultRunePage);
                    landingRactive.set('validCurrentSummoner', false);
                    landingRactive.set('summonerLoaded', true);

                    landingRactive.set('popupActive', true);
                    landingRactive.set('popupWindow', 'noSuchSummoner');
                }
            }
        });

        $.when(request).done(function(s){
            console.log(s);
            for(var summoner in s){
                console.log(s[summoner].id);
                var id = s[summoner].id;

                var masteryUrl = 'https://na.api.pvp.net/api/lol/na/v1.4/summoner/'+ id + '/masteries?api_key=' + key;
                var masteriesRequest = $.ajax({
                    url: masteryUrl,
                    dataType: 'json',
                    type: "GET"
                });

                $.when(masteriesRequest).done(function(masteries){
                    var masteryPages = [];
                    masteries[id].pages.forEach(function(page){
                        var masteryPage = {};
                        masteryPage.name = page.name;
                        masteryPage.masteries = page.masteries;
                        masteryPages.push(masteryPage);
                    });
                    console.log('masteries:');
                    console.log(masteryPages);
                    landingRactive.set('selectedMasteryPage', defaultMasteryPage);
                    landingRactive.set('masteryPages', masteryPages);
                    landingRactive.set('summonerLoaded', true);
                });

                var rankedUrl = 'https://na.api.pvp.net/api/lol/na/v2.5/league/by-summoner/'+id+'?api_key='+key;
                var rankedRequest = $.ajax({
                    url: rankedUrl,
                    dataType: 'json',
                    type: "GET",
                    error: function(request, status, errorThrown){
                        if(errorThrown == 'Not Found'){
                            landingRactive.set('summonerRank', 'Unranked');
                        }
                    }
                });
                $.when(rankedRequest).done(function(ranked){
                    //console.log(ranked);
                    var stats = ranked[id];
                    for(var i = 0; i < stats.length; i++){
                        if(stats[i].queue == "RANKED_SOLO_5x5"){
                            var participantId = stats[i].participantId;
                            var entries = stats[i].entries;
                            var tier = stats[i].tier;
                            var division = '';
                            var leaguePoints = '';
                            for(var j = 0; j < entries.length; j++){
                                if(entries[j].playerOrTeamId == participantId){
                                    division = entries[j].division;
                                    leaguePoints = entries[j].leaguePoints;
                                }
                            }
                            //console.log(tier + ' ' + division + ' - ' + leaguePoints);
                            var rank = tier + ' ' + division + ' - ' + leaguePoints + ' LP';
                            landingRactive.set('summonerRank', rank);
                        }
                    }
                });

                var runesDataUrl = "https://global.api.pvp.net/api/lol/static-data/na/v1.2/rune?api_key="+key;
                var runeDataRequest = $.ajax({
                    url: runesDataUrl,
                    dataType: 'json',
                    type: "GET",
                    data:{
                        runeListData:'stats,image'
                    }
                });

                $.when(runeDataRequest).done(function(runeData){
                    console.log('all runes');
                    console.log(runeData);
                    for(var prop in runeData.data){
                        allRunesData[runeData.data[prop].id] = {
                            stats:runeData.data[prop].stats,
                            image:runeData.data[prop].image.full,
                            name:runeData.data[prop].name
                        };
                    }

                    var runesUrl = 'https://na.api.pvp.net/api/lol/na/v1.4/summoner/' + id + '/runes?api_key=' + key;
                    var runesRequest = $.ajax({
                        url: runesUrl,
                        dataType: 'json',
                        type: "GET"
                    });

                    $.when(runesRequest).done(function(runeData){
                        var runes = runeData[id].pages;
                        var runePages = [];
                        for(var i = 0; i < runes.length; i++){
                            var runeStats = {};
                            var runeItems = {};
                            var runeImages = {};

                            for(var j = 0; j < runes[i].slots.length; j++){
                                var runeId = runes[i].slots[j].runeId;
                                if(runeItems.hasOwnProperty(runeId)){
                                    runeItems[runeId]++;
                                } else {
                                    runeItems[runeId] = 1;
                                }
                                if(!runeImages.hasOwnProperty(runeId)){
                                    runeImages[runeId] = allRunesData[runeId].image;
                                }

                                var stats = allRunesData[runeId].stats;
                                for (var prop in stats){
                                    //console.log("prop: " + prop);
                                    if (runeStats.hasOwnProperty(prop)){
                                        runeStats[prop] += stats[prop];
                                    } else {
                                        runeStats[prop] = stats[prop];
                                    }
                                }
                            }

                            var runePage = {
                                "name" : runes[i].name,
                                "stats" : runeStats,
                                "items" : runeItems,
                                "images" : runeImages
                            };

                            runePages.push(runePage);
                        }
                        console.log("RUNE PAGES");
                        //console.log(runePages);
                        console.log(allRunesData);
                        landingRactive.set('selectedRunePage', defaultRunePage);
                        landingRactive.set('runePages', runePages);
                    });
                });
            }
        });
        landingRactive.set('currentSummoner', landingRactive.get('summonerName'));
        return false;
    })
});

function openPopup(landingRactive, type){
    landingRactive.set('popupActive', true);
    landingRactive.set('popupWindow', type);
}

function closePopup(landingRactive){
    landingRactive.set('popupActive', false);
    landingRactive.set('popupWindow', 'none');
}

function getBaseStats(championStats){
    return {
        hpregen:championStats.hpregen,
        mpregen:championStats.mpregen,
        apen:0,
        mpen:0,
        lifesteal:0,
        spellvamp:0,
        crit:championStats.crit,
        tenacity:0,
        attackdamage:championStats.attackdamage,
        abilitypower:0,
        armor:championStats.armor,
        spellblock:championStats.spellblock,
        attackspeed:Math.round((0.625/(1+championStats.attackspeedoffset))*1000)/1000,
        cdr:0,
        attackrange:championStats.attackrange,
        movespeed:championStats.movespeed,
        hp:championStats.hp,
        mp:championStats.mp
    }
}

function getBaseChampStats(championStats){
    return[{
        hpregen: championStats.hpregen,
        mpregen: championStats.mpregen,
        apen: 0,
        mpen: 0,
        lifesteal: 0,
        spellvamp: 0,
        crit: championStats.crit,
        tenacity: 0,
        attackdamage: championStats.attackdamage,
        abilitypower: 0,
        armor: championStats.armor,
        spellblock: championStats.spellblock,
        attackspeed: Math.round((0.625 / (1 + championStats.attackspeedoffset)) * 1000) / 1000,
        cdr: 0,
        attackrange: championStats.attackrange,
        movespeed: championStats.movespeed,
        hp: championStats.hp,
        mp: championStats.mp
    },
        [{
            "mpperlevel": championStats.mpperlevel,
            "hpperlevel": championStats.hpperlevel,
            "attackdamageperlevel": championStats.attackdamageperlevel,
            "mpregenperlevel": championStats.mpregenperlevel,
            "critperlevel": championStats.critperlevel,
            "spellblockperlevel": championStats.spellblockperlevel,
            "attackspeedperlevel": championStats.attackspeedperlevel,
            "hpregenperlevel": championStats.hpregenperlevel,
            "armorperlevel": championStats.armorperlevel,

        },
        {
            "attackspeedoffset": championStats.armorperlevel,
        }]
    ]
}

function updateStats(LandingRactive, rune, mastery, items){
    /* update stats:*/
    if (rune){
        updateChampStatsRunes(LandingRactive);
    }
    if (mastery){
        updateChampStatsMastery(LandingRactive);
    }
    if (items){
        updateChampStatsItems(LandingRactive);
    }

    /* calculate: */

    /*
    Resources:
    > level_to_other
    > stat_type
    > flat_to_stat [import all still]
     */

    var level = LandingRactive.get('championLevel');
    var champStats = LandingRactive.get('baseChampStats')[0]; /* base */
    var champPerLevelStats = LandingRactive.get('baseChampStats')[1][0];
    var attackSpeedOffset = LandingRactive.get('baseChampStats')[1][1];

    var flatStats = {};     /* flatStats to add */
    var percentStats = {};  /* stats to be factored in after flat */
    var levelStats = {};    /* stats to be converted and added correctly to category */

    var runeStats = LandingRactive.get('runeStats');
    var masteryStats = LandingRactive.get('masteryStats');
    var itemStats = LandingRactive.get('itemStats');

    for (var stat in champPerLevelStats){
        var real_stat = stat.replace('PerLevel', '');
        flatStats[real_stat] += champPerLevelStats[stat] * (level - 1);
    }

    /* move stats to flat / percent */
    for (var prop in runeStats){
        switch(stat_type[prop]){
            case "flat":
                flatStats[prop] = runeStats[prop];
                break;
            case "%":
                percentStats[prop] = runeStats[prop];
                break;
            case "level":
                levelStats[prop] = levelStats[prop];
                break;
        }
    }

    /* move stats to flat / percent */
    for (var prop in masteryStats){
        switch(stat_type[prop]){
            case "flat":
                flatStats[prop] = masteryStats[prop];
                break;
            case "%":
                percentStats[prop] = masteryStats[prop];
                break;
            case "level":
                levelStats[prop] = masteryStats[prop];
                break;
        }
    }

    /* move stats to flat / percent */
    for (var prop in itemStats){
        switch(stat_type[prop]){
            case "flat":
                flatStats[prop] = itemStats[prop];
                break;
            case "%":
                percentStats[prop] = itemStats[prop];
                break;
            case "level":
                levelStats[prop] = itemStats[prop];
                break;
        }
    }
    /* convert level to flat/percentage */
    for (var prop in percentStats){
        /* move to correct category, if in / if not in, multiply * level */
        switch(stat_type[level_to_other[prop]]){
            case "flat":
                if (flatStats.hasOwnProperty(level_to_other[prop])) {
                    flatStats[level_to_other[prop]] += percentStats[prop] * level;
                } else {
                    flatStats[level_to_other[prop]] = percentStats[prop] * level;
                }
                break;
            case "%":
                if (percentStats.hasOwnProperty(level_to_other[prop])) {
                    percentStats[level_to_other[prop]] = percentStats[prop] * level;
                } else {
                    flatStats[level_to_other[prop]] = percentStats[prop] * level;
                }
                break;
        }
    }
    /* add flat to stats */

    /* multiply percentage in */
}


function updateChampStatsMastery(LandingRactive){
    var selectedMasteryPage = LandingRactive.get('selectedMasteryPage');
    var mod = {};

    for(var prop in selectedMasteryPage.masteries){
        var mastery_id = selectedMasteryPage.masteries[prop].id;
        var mastery_rank = selectedMasteryPage.masteries[prop].rank;
        var m_stats = mastery_stats[mastery_id].stats;
        var m_values = mastery_stats[mastery_id].values;


        for(var stat in m_stats) {
            if (m_stats[0] && m_values[stat]) {

                var s_stat = m_stats[stat];
                var s_val = m_values[stat][mastery_rank - 1];

                mod[s_stat] = s_val;
            }
        }

    }
    console.log(mod);
    LandingRactive.set('currentMasteryStats', mod);
}

function updateChampStatsRunes(LandingRactive){
    var selectedRunePage = LandingRactive.get('selectedRunePage');
    var mod = selectedRunePage.stats;
    console.log(mod);
    LandingRactive.set('currentRuneStats', mod);
}

function updateChampStatsItems(LandingRactive){
    /* update item stats */
    /* under the assumption there will be a SelectedItems... */

}


