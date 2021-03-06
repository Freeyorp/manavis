var mob = function(){
  var mob = {};
  var mobs = {
    1002:"Maggot",
    1003:"Scorpion",
    1004:"RedScorpion",
    1005:"GreenSlime",
    1006:"GiantMaggot",
    1007:"YellowSlime",
    1008:"RedSlime",
    1009:"BlackScorpion",
    1010:"Snake",
    1011:"FireGoblin",
    1012:"Spider",
    1013:"EvilMushroom",
    1014:"PinkFlower",
    1015:"SantaSlime",
    1016:"RudolphSlime",
    1017:"Bat",
    1018:"Pinkie",
    1019:"SpikyMushroom",
    1020:"Fluffy",
    1021:"CaveSnake",
    1022:"JackO",
    1023:"FireSkull",
    1024:"PoisonSkull",
    1025:"LogHead",
    1026:"MountainSnake",
    1027:"EasterFluffy",
    1028:"Mouboo",
    1029:"MauvePlant",
    1030:"CobaltPlant",
    1031:"GambogePlant",
    1032:"AlizarinPlant",
    1033:"SeaSlime",
    1034:"GrassSnake",
    1035:"Silkworm",
    1036:"Zombie",
    1037:"CloverPatch",
    1038:"Squirrel",
    1040:"Wisp",
    1041:"Snail",
    1042:"Spectre",
    1043:"Skeleton",
    1044:"LadySkeleton",
    1045:"Fallen",
    1046:"SnakeLord",
    1047:"Poltergeist",
    1049:"Bee",
    1054:"Troll",
    1055:"Butterfly",
    1056:"CaveMaggot",
    1057:"AngryScorpion",
    1058:"IceGoblin",
    1059:"GCMaggot",
    1060:"Archant",
    1061:"Moggun",
    1062:"Terranite",
    1063:"Pumpkin",
    1064:"Bandit",
    1065:"BanditLord",
    1066:"VampireBat",
    1067:"Reaper",
    1068:"Reaper2",
    1069:"Scythe",
    1070:"BallLightning",
    1071:"IceElement",
    1072:"Yeti",
    1073:"TheLost",
    1077:"DrunkenSkeleton",
    1078:"TipsySkeleton",
    1079:"DrunkenLadySkeleton",
    1080:"BlueSpark",
    1081:"RedSpark",
    1082:"Serqet",
    1083:"HuntsmanSpider",
    1084:"CrotcherScorpion",
    1085:"IceSkull",
    1086:"FeyElement",
    1087:"Larvern",
    1088:"Hyvern",
    1089:"HungryFluffy",
    1090:"Wolvern",
    1091:"BlueSlime",
    1092:"SlimeBlast",
    1093:"WhiteSlime",
    1094:"Reinboo",
    1095:"WhiteBell",
    1096:"SoulSnake",
    1097:"SoulEater",
    1098:"CopperSlime",
    1099:"SleepingBandit",
    1100:"AzulSlime",
    1101:"DemonicSpirit",
    1102:"Luvia",
    1103:"WitchGuard",
    1104:"DemonicMouboo",
    1105:"ViciousSquirrel",
    1106:"WickedMushroom",
    1107:"Bluepar",
    1108:"AngryFireGoblin",
    1109:"AngrySeaSlime",
    1110:"AngryGreenSlim",
    1111:"CandiedSlime",
    1112:"Santaboo",
    1113:"Pollett",
    1114:"Nutcracker",
    1116:"UndeadWitch",
    1117:"UndeadTroll",
  };
  mob.nameByServerID = function(serverID) {
    return serverID in mobs ? mobs[serverID] : String(serverID);
  }
  return mob;
}();
