/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月9日
 * 描    述：管线标准
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月9日
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

    /**
     * RGB颜色
     * @param  {[type]} a [description]
     * @param  {[type]} r [description]
     * @param  {[type]} g [description]
     * @param  {[type]} b [description]
     * @return {[type]}   [description]
     */
    var fromArgb = function(a, r, g, b){
        var rgb = r+","+g+","+b;
        var rbgtohex = rgbsToHex(rgb);
        return  rbgtohex;
    }

    /**
     * 转16进制颜色
     * @param  {[type]} rgbArgument [description]
     * @return {[type]}             [description]
     */
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

    /**
     * 材质标准色
     * @param  {[type]} type [管线编码]
     * @return {[type]}      [description]
     */
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
    
    /**
     * 管线国标颜色
     * @param  {[type]} plType [description]
     * @return {[type]}        [description]
     */
    function standardColor(plType) {
       if (plType >= 1000 && plType < 2000) {
            color=parseInt("0xcc"+fromArgb(255, 255, 0, 0)); //电力
        } else if (plType >= 2000 && plType < 3000) { 
             color=parseInt("0xcc"+fromArgb(255, 0, 255, 0));//电信
        } else if (plType >= 3000 && plType < 4000) {
             color=parseInt("0xcc"+fromArgb(255, 0, 255, 255));//给水
        } else if (plType >= 4000 && plType < 5000) {
            color=parseInt("0xcc"+fromArgb(255, 127, 0, 0));//排水
        } else if (plType >= 5000 && plType < 6000) {
             color=parseInt("0xcc"+fromArgb(255, 255, 0, 255));//燃气
        } else if (plType >= 6000 && plType < 7000) {
             color=parseInt("0xcc"+fromArgb(255, 255, 102, 0));//热力
        } else if (plType >= 7000 && plType < 8000) {
            color=parseInt("0xcc"+fromArgb(255, 0, 0, 0));//工业
        } else if (plType >= 8000 ) {
            color=parseInt("0xcc"+fromArgb(255, 0, 127, 127));//其他
        }
        return color;
    }

    /**
     * 获取管线标准颜色
     * @param {[type]} type [description]
     */
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

    PipelineStandard.PipelineType = PipelineType;
    PipelineStandard.getStandardLineColor = getStandardLineColor;
    PipelineStandard.standardColor = standardColor;
})();
