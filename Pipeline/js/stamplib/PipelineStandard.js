/**
 * 管线标准相关
 */
var PipelineStandard = {};
(function () {
    var PipelineType = {};
    PipelineType.Unknown = 0; // 未知（无效类型）
    PipelineType.Electricity = 1000;   // 电力
    PipelineType.Streetlamp = 1200;    // 路灯
    PipelineType.Telegraphy = 2000;   // 电信
    PipelineType.Television = 2100;    // 电视
    PipelineType.FeedWater = 3000;   // 供水
    PipelineType.Sewage = 4000;   // 污水
    PipelineType.Rain = 4001;   // 雨水
    PipelineType.Gas = 5000;   // 燃气
    PipelineType.Energetics = 6000;  // 热力
    PipelineType.Industry = 7000;  // 工业
    PipelineType.Road = 8100;   // 道路

    var PipelineLayoutType = {};
    PipelineLayoutType.Layout_ZHIMAI = 0; // 直埋
    PipelineLayoutType.Layout_GUANMAI = 1; // 管埋
    PipelineLayoutType.Layout_GUANKUAI = 2; // 管块
    PipelineLayoutType.Layout_GOUDAO = 3; // 沟道
    PipelineLayoutType.Layout_JIAKONG = 4; // 架空
    PipelineLayoutType.Layout_UNKNOWN = 11; // 未知

    var mStandardTableCov = [];
    var mStandardTableVer = [];
    var mStandardTableHor = [];

    // |-----------------------------------------------------------------------------------------|
    // |  最小  |     电    力    |    电    信     |    热    力     |        |        |        |
    // |  覆土  |-----------------|-----------------|-----------------|  燃气  |  供水  |  排水  |
    // |  深度  |  直埋  |  管沟  |  直埋  |  管沟  |  直埋  |  管沟  |        |        |        |
    // |--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|
    // | 人行道 |  0.5   |  0.4   |  0.7   |  0.4   |  0.5   |  0.2   |  0.6   |  0.6   |  0.6   |
    // |--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|
    // | 车行道 |  0.7   |  0.5   |  0.8   |  0.7   |  0.7   |  0.2   |  0.7   |  0.7   |  0.7   |
    // |-----------------------------------------------------------------------------------------|
    mStandardTableCov[0] = [0.5, 0.4, 0.7, 0.4, 0.5, 0.2, 0.6, 0.6, 0.6]; // 人行道
    mStandardTableCov[1] = [0.7, 0.5, 0.8, 0.7, 0.7, 0.2, 0.7, 0.7, 0.7];  // 车行道

    // |--------------------------------------------------------------------------------|
    // |  最小  |        |        |        |        |    电    信     |     电    力    |
    // |  垂直  |  给水  |  排水  |  热力  |  燃气  |-----------------|-----------------|
    // |  净距  |        |        |        |        |  直埋  |  管块  |  直埋  |  管沟  |
    // |--------|--------|--------|--------|--------|--------|--------|--------|--------|
    // | 给水   |  0.15  |        |        |        |        |        |        |        |
    // |--------|--------|--------|--------|--------|--------|--------|--------|--------|
    // | 排水   |  0.4   |  0.15  |        |        |        |        |        |        |
    // |--------|--------|--------|--------|--------|--------|--------|--------|--------|
    // | 热力   |  0.15  |  0.15  |  0.15  |        |        |        |        |        |
    // |--------|--------|--------|--------|--------|--------|--------|--------|--------|
    // | 燃气   |  0.15  |  0.15  |  0.15  |  0.15  |        |        |        |        |
    // |--------|--------|--------|--------|--------|--------|--------|--------|--------|
    // | 电|直埋|  0.5   |  0.5   |  0.15  |  0.5   |  0.25  |  0.25  |        |        |
    // |   |----|--------|--------|--------|--------|--------|--------|--------|--------|
    // | 信|管块|  0.15  |  0.15  |  0.15  |  0.15  |  0.25  |  0.25  |        |        |
    // |--------|--------|--------|--------|--------|--------|--------|--------|--------|
    // | 电|直埋|  0.15  |  0.5   |  0.5   |  0.5   |  0.5   |  0.5   |  0.5   |  0.5   |
    // |   |----|--------|--------|--------|--------|--------|--------|--------|--------|
    // | 力|管沟|  0.15  |  0.5   |  0.5   |  0.15  |  0.5   |  0.5   |  0.5   |  0.5   |
    // |--------------------------------------------------------------------------------|
    mStandardTableVer[0] = [0.15, 0.4, 0.15, 0.15, 0.5, 0.15, 0.15, 0.15]; // 给水
    mStandardTableVer[1] = [0.4, 0.15, 0.15, 0.15, 0.5, 0.15, 0.5, 0.5 ]; // 排水
    mStandardTableVer[2] = [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.5, 0.5 ]; // 热力
    mStandardTableVer[3] = [0.15, 0.15, 0.15, 0.15, 0.5, 0.15, 0.5, 0.15]; // 燃气
    mStandardTableVer[4] = [0.5, 0.5, 0.15, 0.5, 0.25, 0.25, 0.5, 0.5 ]; // 电信直埋
    mStandardTableVer[5] = [0.15, 0.15, 0.15, 0.15, 0.25, 0.25, 0.5, 0.5 ]; // 电信管块
    mStandardTableVer[6] = [0.15, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5 ]; // 电力直埋
    mStandardTableVer[7] = [0.15, 0.5, 0.5, 0.15, 0.5, 0.5, 0.5, 0.5 ]; // 电力管沟

    // |--------------------------------------------------------------------------------------------------------------------------------|
    // |    最小   |    给    水     |        |             燃          气                 |    热    力     |        |     电    信    |
    // |    水平   |-----------------|  排水  |--------------------------------------------|-----------------|  电力  |-----------------|
    // |    净距   |d<=200mm|d>200mm |        |  低压  | 中压小 | 中压大 | 高压小 | 高压大 |  直埋  |  地沟  |        |  直埋  |  管道  |
    // |-----------|-----------------|--------|--------------------------|--------|--------|-----------------|--------|-----------------|
    // | 给|d<=200 |                 |  1.0   |                          |        |        |                 |        |                 |
    // |   |-------|                 |--------|           0.5            |  1.0   |  1.5   |       1.5       |  0.5   |       1.0       |
    // | 水|d>200  |                 |  1.5   |                          |        |        |                 |        |                 |
    // |-----------|-----------------|--------|--------------------------|--------|--------|-----------------|--------|-----------------|
    // | 排水      |  1.0   |  1.5   |        |   1.0  |       1.2       |  1.5   |  2.0   |       1.5       |  0.5   |       1.0       |
    // |-----------|-----------------|--------|--------------------------------------------|-----------------|--------|-----------------|
    // |   |低压   |                 |  1.0   |                                            |       1.0       |        |        |        |
    // |   |-------|                 |--------|                                            |-----------------|        |        |        |
    // | 燃|中压小 |       0.5       |        |             DN <= 300mm 0.4                |        |        |  0.5   |  0.5   |  1.0   |
    // |   |-------|                 |  1.2   |                                            |  1.0   |  1.5   |        |        |        |
    // |   |中压大 |                 |        |                                            |        |        |        |        |        |
    // |   |-------|-----------------|--------|                                            |-----------------|--------|-----------------|
    // | 气|高压小 |       1.0       |  1.5   |             DN >  300mm 0.5                |  1.5   |  2.0   |  1.0   |       1.0       |
    // |   |-------|-----------------|--------|                                            |-----------------|--------|-----------------|
    // |   |高压大 |       1.5       |  2.0   |                                            |  2.0   |  4.0   |  1.5   |       1.5       |
    // |-----------|-----------------|--------|--------------------------------------------|-----------------|--------|-----------------|
    // | 热|直埋   |                 |        |        |       1.0       |  1.5   |  2.0   |                 |        |                 |
    // |   |-------|       1.5       |  1.5   |  1.0   |-----------------|--------|--------|                 |  2.0   |       1.0       |
    // | 力|地沟   |                 |        |        |       1.5       |  2.0   |  4.0   |                 |        |                 |
    // |-----------|-----------------|--------|--------------------------|--------|--------|-----------------|--------|-----------------|
    // | 电力      |        0.5      |  0.5   |           0.5            |  1.0   |  1.5   |       2.0       |        |       0.5       |
    // |-----------|-----------------|--------|--------------------------|--------|--------|-----------------|--------|-----------------|
    // | 电|直埋   |                 |        |           0.5            |        |        |                 |        |                 |
    // |   |-------|       1.0       |  1.0   |--------------------------|  1.0   |  1.5   |       1.0       |  0.5   |       1.0       |
    // | 信|管道   |                 |        |           1.0            |        |        |                 |        |                 |
    // |--------------------------------------------------------------------------------------------------------------------------------|
    // 其中:
    // 燃气低压  ： p <= 0.05Mpa
    // 燃气中压小： 0.05Mpa < p <= 0.2 Mpa
    // 燃气中压大： 0.2 Mpa < p <= 0.4 Mpa
    // 燃气高压小： 0.4 Mpa < p <= 0.8 Mpa
    // 燃气高压大： 0.8 Mpa < p <= 1.6 Mpa
    mStandardTableHor[0] = [0.0, 0.0, 1.0, 0.5, 0.5, 0.5, 1.0, 1.5, 1.5, 1.5, 0.5, 1.0, 1.0]; // 给水管径小
    mStandardTableHor[1] = [0.0, 0.0, 1.5, 0.5, 0.5, 0.5, 1.0, 1.5, 1.5, 1.5, 0.5, 1.0, 1.0]; // 给水管径大
    mStandardTableHor[2] = [1.0, 1.5, 0.0, 1.0, 1.2, 1.2, 1.5, 2.0, 1.5, 1.5, 0.5, 1.0, 1.0]; // 排水
    mStandardTableHor[3] = [0.5, 0.5, 1.0, 0.5, 0.5, 0.5, 0.5, 0.5, 1.0, 1.0, 0.5, 0.5, 1.0]; // 燃气低压
    mStandardTableHor[4] = [0.5, 0.5, 1.2, 0.5, 0.5, 0.5, 0.5, 0.5, 1.0, 1.5, 0.5, 0.5, 1.0]; // 燃气中压小
    mStandardTableHor[5] = [0.5, 0.5, 1.2, 0.5, 0.5, 0.5, 0.5, 0.5, 1.0, 1.5, 0.5, 0.5, 1.0]; // 燃气中压大
    mStandardTableHor[6] = [1.0, 1.0, 1.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.5, 2.0, 1.0, 1.0, 1.0]; // 燃气高压小
    mStandardTableHor[7] = [1.5, 1.5, 2.0, 0.5, 0.5, 0.5, 0.5, 0.5, 2.0, 4.0, 1.5, 1.5, 1.5]; // 燃气高压大
    mStandardTableHor[8] = [1.5, 1.5, 1.5, 1.0, 1.0, 1.0, 1.5, 2.0, 0.0, 0.0, 2.0, 1.0, 1.0]; // 热力直埋
    mStandardTableHor[9] = [1.5, 1.5, 1.5, 1.0, 1.5, 1.5, 2.0, 4.0, 0.0, 0.0, 2.0, 1.0, 1.0]; // 热力地沟
    mStandardTableHor[10] = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.0, 1.5, 2.0, 2.0, 0.0, 0.5, 0.5]; // 电力
    mStandardTableHor[11] = [1.0, 1.0, 1.0, 0.5, 0.5, 0.5, 1.0, 1.5, 1.0, 1.0, 0.5, 1.0, 1.0]; // 电信直埋
    mStandardTableHor[12] = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.5, 1.0, 1.0, 0.5, 1.0, 1.0]; // 电信管道

    var getCoverageStandard = function (lineType, layoutType, beRoadway) {
        var row = 0, col = 0;
        if (beRoadway) row = 1;
        switch (lineType) {
            case PipelineType.Electricity:  // 电力
                if (layoutType == PipelineLayoutType.Layout_ZHIMAI) col = 0;
                else col = 1;
                break;
            case PipelineType.Telegraphy:   // 电信
                if (layoutType == PipelineLayoutType.Layout_ZHIMAI) col = 2;
                else col = 3;
                break;
            case PipelineType.Energetics:   // 热力
                if (layoutType == PipelineLayoutType.Layout_ZHIMAI) col = 4;
                else col = 5;
                break;
            case PipelineType.FeedWater:    // 供水
                col = 6;
                break;
            case PipelineType.Sewage:       // 排水
            case PipelineType.Rain:
                col = 7;
                break;
            case PipelineType.Gas:          // 燃气
                col = 8;
                break;
            case PipelineType.Streetlamp:          // 路灯
                col = 0;
                break;
            default:
                return 0.0;
        }
        return mStandardTableCov[row][col];
    };

    var getVerticalSpacingStandard = function (targetLineType, targetLayoutType, referLineType, referLayoutType) {
        var row = 0, col = 0;

        switch (targetLineType) {
            case PipelineType.FeedWater:    // 供水
                row = 0;
                break;
            case PipelineType.Sewage:       // 排水
            case PipelineType.Rain:
                row = 1;
                break;
            case PipelineType.Energetics:   // 热力
                row = 2;
                break;
            case PipelineType.Gas:          // 燃气
                row = 3;
                break;
            case PipelineType.Telegraphy:   // 电信
                if (targetLayoutType == PipelineLayoutType.Layout_ZHIMAI) row = 4;
                else row = 5;
                break;
            case PipelineType.Electricity:  // 电力
                if (targetLayoutType == PipelineLayoutType.Layout_ZHIMAI) row = 6;
                else row = 7;
                break;
            case PipelineType.Streetlamp:          // 路灯
                row = 6;
                break;
            default:
                return 0.0;
        }
        switch (referLineType) {
            case PipelineType.FeedWater:    // 供水
                col = 0;
                break;
            case PipelineType.Sewage:       // 排水
            case PipelineType.Rain:
                col = 1;
                break;
            case PipelineType.Energetics:   // 热力
                col = 2;
                break;
            case PipelineType.Gas:          // 燃气
                col = 3;
                break;
            case PipelineType.Telegraphy:   // 电信
                if (targetLayoutType == PipelineLayoutType.Layout_ZHIMAI) col = 4;
                else col = 5;
                break;
            case PipelineType.Electricity:  // 电力
                if (targetLayoutType == PipelineLayoutType.Layout_ZHIMAI) col = 6;
                else col = 7;
                break;
            case PipelineType.Streetlamp:          // 路灯
                col = 6;
                break;
            default:
                return 0.0;
        }
        return mStandardTableVer[row][col];
    };

    var getHorizontalSpacingStandard = function (targetLineType, targetLayoutType, referLineType, referLayoutType) {
        var row = 0, col = 0;

        switch (targetLineType) {
            case PipelineType.FeedWater:    // 供水, 0-1
                row = 0;
                break;
            case PipelineType.Sewage:       // 排水, 2
            case PipelineType.Rain:
                row = 2;
                break;
            case PipelineType.Gas:          // 燃气, 3-7
                row = 3;
                break;
            case PipelineType.Energetics:   // 热力, 8-9
                if (targetLayoutType == PipelineLayoutType.Layout_ZHIMAI) row = 8;
                else row = 9;
                break;
            case PipelineType.Electricity:  // 电力, 10
                row = 10;
                break;
            case PipelineType.Telegraphy:   // 电信, 11-12
                if (targetLayoutType == PipelineLayoutType.Layout_ZHIMAI) row = 11;
                else row = 12;
                break;
            case PipelineType.Streetlamp:          // 路灯
                row = 10;
                break;
            default:
                return 0.0;
        }
        switch (referLineType) {
            case PipelineType.FeedWater:    // 供水, 0-1
                col = 0;
                break;
            case PipelineType.Sewage:       // 排水, 2
            case PipelineType.Rain:
                col = 2;
                break;
            case PipelineType.Gas:          // 燃气, 3-7
                col = 3;
                break;
            case PipelineType.Energetics:   // 热力, 8-9
                if (targetLayoutType == PipelineLayoutType.Layout_ZHIMAI) col = 8;
                else col = 9;
                break;
            case PipelineType.Electricity:  // 电力, 10
                col = 10;
                break;
            case PipelineType.Telegraphy:   // 电信, 11-12
                if (targetLayoutType == PipelineLayoutType.Layout_ZHIMAI) col = 11;
                else col = 12;
                break;
            case PipelineType.Streetlamp:          // 路灯
                col = 10;
                break;
            default:
                return 0.0;
        }
        return mStandardTableHor[row][col];
    };

    var fromArgb = function(a, r, g, b){
        // red: 'ffff0000'
        var rgb = r+","+g+","+b;
        var rbgtohex = rgbsToHex(rgb);
        return  rbgtohex;
    }
    var rgbsToHex = function(rgbArgument) {
        var result = rgbArgument.split(",");
        var R = result[0];
        var G = result[1];
        var B = result[2];
        var n = Math.round(B);
        n += Math.round(G) << 8;
        n += Math.round(R) << 16;
        var i = 0; var j = 20;
        var str = "";
        while(j >= 0) {
            i = (n >> j)%16;
            if(i >= 10) {
                if(i == 10) str += "A";
                else if(i == 11) str += "B";
                else if(i == 12) str += "C";
                else if(i == 13) str += "D";
                else if(i == 14) str += "E";
                else str += "F";
            }else{
                str += i;
            }
            j -= 4;
        }
        return str;
    }
    var getStandardLineColor = function (type) {
        switch (type) {
            case PipelineType.Electricity:  // 电力，红
                return fromArgb(255, 255, 0, 0);
            case PipelineType.Telegraphy:   // 电信，草绿
                return fromArgb(255, 38, 153, 0);
            case PipelineType.FeedWater:    // 供水，天蓝
                return fromArgb(255, 0, 255, 255);
            case PipelineType.Sewage:       // 污水，深褐
                return fromArgb(255, 76, 38, 0);
            case PipelineType.Rain:         // 雨水，浅褐
                return fromArgb(255, 76, 57, 0);
                //return fromArgb(255, 255, 0, 0);
            case PipelineType.Gas:          // 燃气，粉红
                return fromArgb(255, 255, 0, 255);
            case PipelineType.Energetics:   // 热力，紫
                return fromArgb(255, 153, 133, 76);
            case PipelineType.Industry:     // 工业，灰
                return fromArgb(255, 128, 128, 128);
            case PipelineType.Television:   // 电视，绿
                return fromArgb(255, 0, 255, 0);
            case PipelineType.Streetlamp:          // 路灯
                return fromArgb(255, 255, 127, 0);
            default:
                return GetStandardLineColorEx((type / 1000) * 1000);
        }
    };
     //为交大项目横切面的点颜色专属方法 
    var getMaterialColorForjiaoda = function(type) {
        switch (type) {
            case 6000: // RL
                return fromArgb(255, 255, 190, 0);
            case 3200: // zh
                return fromArgb(255, 255, 190, 0);
            case 3000: // js
                return fromArgb(255, 0, 0, 254);
            case 4200: // ws
                return fromArgb(255, 57, 104, 0);
                /*  case PipelineType.Rain:         // 雨水，浅褐
                return fromArgb(255, 76, 57, 0);
                //return fromArgb(255, 255, 0, 0);*/
            case 5300: // tr
                return fromArgb(255, 255, 0, 255);
            case 2100: // dx
                return fromArgb(255, 0, 255, 1);
            case 1300: // ld
                return fromArgb(255, 83, 165, 125);
            case 4100: // ys
                return fromArgb(255, 142, 70, 232);
            case 6200: // rs
                return fromArgb(255, 255, 190, 0);
            case 3300: // zs
                return fromArgb(255, 0, 0, 254);
            case 1100: // dl
                return fromArgb(255, 254, 0, 0);
            default:
                return GetStandardLineColorEx((type / 1000) * 1000);
        }
    }
     //国标
    function standardColor(plType) {
       if (plType >= 1000 && plType < 2000) {
                    //color = parseInt("0xcc" + "FF0000");
                    color=parseInt("0xcc"+fromArgb(255, 255, 0, 0)); //电力

                } else if (plType >= 2000 && plType < 3000) { 
                    //color = parseInt("0xcc" + "00ff00");
                     color=parseInt("0xcc"+fromArgb(255, 0, 255, 0));//电信
                } else if (plType >= 3000 && plType < 4000) {
                    //color = parseInt("0xcc" + "0000ff");
                     color=parseInt("0xcc"+fromArgb(255, 0, 255, 255));//给水
                } else if (plType >= 4000 && plType < 5000) {
                    //color = parseInt("0xcc" + "cc9900");
                    color=parseInt("0xcc"+fromArgb(255, 127, 0, 0));//排水
                } else if (plType >= 5000 && plType < 6000) {
                    //color = parseInt("0xcc" + "ff00ff");
                     color=parseInt("0xcc"+fromArgb(255, 255, 0, 255));//燃气
                } else if (plType >= 6000 && plType < 7000) {
                    //color = parseInt("0xcc" + "0099cc");
                     color=parseInt("0xcc"+fromArgb(255, 255, 102, 0));//热力
                } else if (plType >= 7000 && plType < 8000) {
                    //color = parseInt("0xcc" + "000000");
                    color=parseInt("0xcc"+fromArgb(255, 0, 0, 0));//工业
                } else if (plType >= 8000 ) {
                    color=parseInt("0xcc"+fromArgb(255, 0, 127, 127));//其他
                }
        return color;
    }

    var GetStandardLineColorEx = function (type) {
        switch (type) {
            case PipelineType.Electricity:  // 电力，红
                return fromArgb(255, 255, 0, 0);
            case PipelineType.Telegraphy:   // 电信，草绿
                return fromArgb(255, 38, 153, 0);
            case PipelineType.FeedWater:    // 供水，天蓝
                return fromArgb(255, 0, 255, 255);
            case PipelineType.Sewage:       // 污水，深褐
                return fromArgb(255, 76, 38, 0);
            case PipelineType.Rain:         // 雨水，浅褐
                return fromArgb(255, 76, 57, 0);
            case PipelineType.Gas:          // 燃气，粉红
                return fromArgb(255, 255, 0, 255);
            case PipelineType.Energetics:   // 热力，紫
                return fromArgb(255, 153, 133, 76);
            case PipelineType.Industry:     // 工业，灰
                return fromArgb(255, 128, 128, 128);
            case PipelineType.Television:   // 电视，绿
                return fromArgb(255, 0, 255, 0);
            case PipelineType.Streetlamp:          // 路灯
                return fromArgb(255, 255, 127, 0);
            default:
                return fromArgb(255, 128, 128, 128);
        }
    };

    /**
     * 根据管线图层的类型来获取对应的属性字段
     * TODO:自定义字段也要处理......
     * @param  {[type]} layerType [description]
     * @return {[type]}           [description]
     */
    var getFieldsByType = function(layerType){
        var header = [];
        var aliasHeader = [];
        if( layerType >= 1000 && layerType <= 1808 ){//电力
            header.push("US_KEY","US_LTTYPE", "US_SDEEP","US_EDEEP","US_PMATER", "US_PDIAM","US_VOLTAGE", "US_VENTNUM",  "US_HOLE_TO",  "US_HOLE_US", "US_IS_SCRA", "US_BD_TIME", "US_FX_YEAR", "US_OWNER", "US_ROAD", "US_STATE", "US_UPDATE");
            aliasHeader.push("管线标识","埋设方式",  "起点埋深" ,"终点埋深", "管线材质", "管线管径", "电压", "电缆条数", "总孔数","已用孔数", "废弃年代", "建设年代", "使用年限", "权属单位", "所在道路", "使用状态", "更新状态");
        }else if( layerType >= 2000 && layerType <= 2405 ){//电信
           header.push("US_KEY","US_LTTYPE", "US_SDEEP","US_EDEEP","US_PMATER", "US_PDIAM","US_VENTNUM",  "US_HOLE_TO",  "US_HOLE_US", "US_IS_SCRA", "US_BD_TIME", "US_FX_YEAR", "US_OWNER", "US_ROAD", "US_STATE", "US_UPDATE");
            aliasHeader.push("管线标识","埋设方式",  "起点埋深" ,"终点埋深","管线材质", "管线管径", "电缆条数", "总孔数","已用孔数", "废弃年代", "建设年代", "使用年限", "权属单位", "所在道路", "使用状态", "更新状态");
        }else if( layerType >= 3000 && layerType <= 3513 ){//给水
            header.push("US_KEY","US_LTTYPE", "US_SDEEP","US_EDEEP","US_PMATER", "US_PDIAM","US_IS_SCRA", "US_BD_TIME", "US_FX_YEAR", "US_OWNER", "US_ROAD", "US_STATE", "US_UPDATE");
            aliasHeader.push("管线标识","埋设方式",  "起点埋深" ,"终点埋深", "管线材质", "管线管径","废弃年代", "建设年代", "使用年限", "权属单位", "所在道路", "使用状态", "更新状态");
        }else if( layerType >= 4000 && layerType <= 4306 ){//排水
            header.push("US_KEY","US_LTTYPE", "US_SDEEP","US_EDEEP","US_FLOWDIR", "US_PMATER", "US_PDIAM","US_IS_SCRA", "US_BD_TIME", "US_FX_YEAR", "US_OWNER", "US_ROAD", "US_STATE", "US_UPDATE");
            aliasHeader.push("管线标识","埋设方式",  "起点埋深" ,"终点埋深", "管内流向", "管线材质", "管线管径","废弃年代", "建设年代", "使用年限", "权属单位", "所在道路", "使用状态", "更新状态");
        }else if( layerType >= 5000 && layerType <= 5305 ){//燃气
            header.push("US_KEY","US_LTTYPE", "US_SDEEP","US_EDEEP","US_PRESSUR", "US_PMATER", "US_PDIAM","US_IS_SCRA", "US_BD_TIME", "US_FX_YEAR", "US_OWNER", "US_ROAD", "US_STATE", "US_UPDATE");
            aliasHeader.push("管线标识","埋设方式",  "起点埋深" ,"终点埋深", "压力", "管线材质", "管线管径","废弃年代", "建设年代", "使用年限", "权属单位", "所在道路", "使用状态", "更新状态");
        }else if( layerType >= 6000 && layerType <= 6203 ){//热力
            header.push("US_KEY","US_LTTYPE","US_SDEEP","US_EDEEP", "US_PRESSUR", "US_PMATER", "US_PDIAM","US_IS_SCRA", "US_BD_TIME", "US_FX_YEAR", "US_OWNER", "US_ROAD", "US_STATE", "US_UPDATE");
            aliasHeader.push("管线标识","埋设方式",  "起点埋深" ,"终点埋深", "压力", "管线材质", "管线管径","废弃年代", "建设年代", "使用年限", "权属单位", "所在道路", "使用状态", "更新状态");
        }else if( layerType >= 7000 && layerType <= 7402 ){//工业
            header.push("US_KEY","US_LTTYPE", "US_SDEEP","US_EDEEP","US_FLOWDIR" ,"US_PRESSUR", "US_PMATER", "US_PDIAM","US_IS_SCRA", "US_BD_TIME", "US_FX_YEAR", "US_OWNER", "US_ROAD", "US_STATE", "US_UPDATE");
            aliasHeader.push("管线标识","埋设方式",  "起点埋深" ,"终点埋深","管内流向", "压力", "管线材质", "管线管径","废弃年代", "建设年代", "使用年限", "权属单位", "所在道路", "使用状态", "更新状态");
        }else{
            alert("地下管线分类编码不符合国家标准!");
        }
        return [header, aliasHeader];
    };

    PipelineStandard.PipelineType = PipelineType;
    PipelineStandard.PipelineLayoutType = PipelineLayoutType;
    PipelineStandard.getFieldsByType = getFieldsByType;
    PipelineStandard.getCoverageStandard = getCoverageStandard;
    PipelineStandard.getVerticalSpacingStandard = getVerticalSpacingStandard;
    PipelineStandard.getHorizontalSpacingStandard = getHorizontalSpacingStandard;
    PipelineStandard.getStandardLineColor = getStandardLineColor;
    PipelineStandard.standardColor = standardColor;
     PipelineStandard.getMaterialColorForjiaoda = getMaterialColorForjiaoda;
    

})();
