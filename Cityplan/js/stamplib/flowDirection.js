/**
 * 作    者：StampGIS Team
 * 创建日期：2017年6月15日
 * 描    述：流向分析
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 * 思路：流向效果显示10s，如果再点击流向分析也可以去掉之前的流向分析的效果。先是判断了管线图层的类型，然后在判断有没有流向字段，再进行的分析
 * 由于管线管径太小贴图不明显，而且坐标跟发布之后的管线是有一定的偏差的，所以将管径都调大了
 */

var FlowDirection = {};
(function() {
    var generPipe = [];//选取管线之后生成管线存放的数组
    
    /**
     * 获取本地客户端root文件夹加路径
     * @return {[type]} [description]
     */
    function getRootPath() {
        var url = window.location.href;
        url = url.substring(0,url.lastIndexOf('/'));
        return url;
    }
    
    /**
     * 根据流向创建点集
     * @param  {[type]} coords     [起始坐标字符串]
     * @param  {[type]} sHeight    [起点高程]
     * @param  {[type]} eHeight    [终点高程]
     * @param  {[type]} flowDirect [0,起点到终点;1,终点到起点;]
     * @return {[type]}            [description]
     */
    var getV3s = function(coords,sHeight,eHeight,flowDirect){
        if(Number(flowDirect) == 1){
            var startX = coords.split(",")[0];
            var startY = coords.split(",")[1];
            var endX = coords.split(",")[3];
            var endY = coords.split(",")[4];  
        }else if(Number(flowDirect) == 0){
            var startX = coords.split(",")[3];
            var startY = coords.split(",")[4];
            var endX = coords.split(",")[0];
            var endY = coords.split(",")[1];
        }
        if(isNaN(parseFloat(startX)) || isNaN(parseFloat(startY)) || isNaN(parseFloat(sHeight)) 
                ||isNaN(parseFloat(endX)) || isNaN(parseFloat(endY)) ||  isNaN(parseFloat(eHeight))){
            return false;
        }
        var v3s = top.LayerManagement.earth.Factory.CreateVector3s();
        v3s.Add(startX,startY,sHeight);
        v3s.Add(endX,endY,eHeight);
        return v3s;
    };

    /**
     * 根据返回的管线起始坐标字符串，组合成vector3s集合
     * @param  {[string]} coords     [起始坐标字符串]
     * @param  {[num]}    sHeight    [起点高程]
     * @param  {[num]}    eHeight    [终点高程]
     * @param  {[num]}   flowDirect [流向]
     * @return {[Vector3s]}            [vector3s点集合]
     */
    var getV3sOrig = function(coords,sHeight,eHeight,flowDirect){
        var startX = coords.split(",")[0];
        var startY = coords.split(",")[1];
        var endX = coords.split(",")[3];
        var endY = coords.split(",")[4]; 
        var datum = top.SYSTEMPARAMS.pipeDatum;
        var coordinates = "";
        var startPoint = datum.src_xy_to_des_BLH(startX,startY,0);
        coordinates += startPoint.X + "," + startPoint.Y + "," + 0 +","
        var endPoint = datum.src_xy_to_des_BLH(endX,endY,0);
        coordinates += endPoint.X + "," + endPoint.Y + "," + 0;
        var v3s = getV3s(coordinates,sHeight,eHeight,flowDirect);
        return v3s;
    };

    //关闭流向，实际上是去掉生成的管线的一个过程
    var closeSingleFlowing = function(){
        var len = generPipe.length;
        for(var i=0 ; i<len ; i++){
            top.LayerManagement.earth.DetachObject(generPipe[i]);
            generPipe.pop();
        }
    }

    /**
     * 生成管线贴图
     * @param  {[type]} pipeInfo   [管线信息]
     * @param  {[type]} flowDirect [管线流向]
     * @param  {[type]} key        [管线编码]
     * @param  {[type]} layerCode  [管线图层编码]
     * @return {[type]}            [description]
     */
    var createPipe = function(pipeInfo,flowDirect,key,layerCode){
    	debugger;
        var earth = top.LayerManagement.earth;
        var specField = top.getName("US_SIZE",1,true);
        var specification = pipeInfo[specField];
        var texturePath = getRootPath() + "/images/flow.jpg";
        var coords = pipeInfo.SHAPE.Polyline.Coordinates;
        var coords2 = pipeInfo.SHAPE.Polyline.OriginalCoordinates;
        var sHeightField = top.getName("US_SALT",1,true);
        var eHeightField = top.getName("US_EALT",1,true);
        var sHeight = pipeInfo[sHeightField];
        var eHeight = pipeInfo[eHeightField];
        if(layerCode == 4000){//排水管线
            sHeight = parseFloat(sHeight);
            eHeight = parseFloat(eHeight);
            if(specification.indexOf("X") == -1){
                var spec = Number(specification)*0.0005;
                sHeight = sHeight-spec;//半径根据发布方式来确定加减
                eHeight = eHeight-spec;
                
            }else{
                var specHeight = specification.split("X")[1];
                specHeight = Number(specHeight)*0.0005;
                sHeight = sHeight-specHeight;
                eHeight = eHeight-specHeight;//半径根据发布方式来确定加减
            }
        };
        var name = key;
        var model = null;

        var v3s = getV3sOrig(coords2,sHeight,eHeight,flowDirect);
        if(v3s){
            var pipeGuid = earth.Factory.CreateGuid();
            if(specification.indexOf("X") == -1){
                var radius = 0.0005 * parseFloat(specification)+0.03;
                if(radius<0.6){
                    radius = 0.6;
                }
                model = earth.TerrainManager.GenerateRoundTunnel(pipeGuid, name, v3s, radius, 24, texturePath, true);
            }else{
                var sWidth = specification.split("X")[0];
                sWidth = 0.001 * parseFloat(sWidth)+0.5;
                var sHeight = specification.split("X")[1];
                sHeight = 0.001 * parseFloat(sHeight)+0.8;
                model = earth.TerrainManager.GenerateTunnel(pipeGuid, name, v3s, sWidth, sHeight, texturePath, true); 
            }
            earth.AttachObject(model);
            generPipe.push(model);
            setTimeout(function(){
                closeSingleFlowing();
            },20000);
        }
    };

    /**
     * 拾取管线回调
     * @param  {[type]} pObj [拾取的管线对象]
     * @return {[type]}      [description]
     */
    var onPickObjectEx = function(pObj){
        var earth = top.LayerManagement.earth;
        var objKey=pObj.GetKey();
        pObj.Underground = true;
        earth.Event.OnPickObjectEx = function () {};
        earth.Query.FinishPick();
        var parentLayerNameTemp = pObj.GetParentLayerName();
        var parentLayerName = parentLayerNameTemp.split("=")[1];
        var layerType = parentLayerNameTemp.split("_")[1];
        if (layerType < 3000 || layerType > 5000) {
            alert("该管线不支持流向分析");
            return;
        } 
        layerType = layerType.toUpperCase();
        if(layerType == "CONTAINER" || layerType == "CONTAINER_OG"){
            var bLine = 1;
            var pipeType = "line";
        }else{
            alert("请选择管线");
            return;
        }
        var str=parentLayerNameTemp.split("=")[1].split("_");
        var layerID = str[0];
        var layer = earth.LayerManager.GetLayerByGUID(layerID);
        var layerCode = layer.PipeLineType;

        var US_KEY = top.getName("US_KEY", bLine, true);
        var strPara = "(and,equal," + US_KEY + ",";
                strPara += objKey;
                strPara += ")";
        var strConn = layer.GISServer + "dataquery?service=" + layerID + "&qt=17&dt="+ pipeType +"&pc=" + strPara + "&pg=0,100";
        earth.Event.OnEditDatabaseFinished = function(pRes, pFeature) {
            if (pRes.ExcuteType == 27) {//excuteType,27表示成功
                var xmlStr = pRes.AttributeName;
                var xmlDoc = loadXMLStr(xmlStr);
                var result = $.xml2json(xmlDoc.xml);
                if(result){
                    result = result.Result;
                }else{
                    return;
                }
                if(result.num > 0){
                    var record = result.Record;
                    var flowField = getName("US_FLOWDIR",1,true);
                    var flowDirect = record[flowField];
                    if(flowDirect == ""){
                        alert("该管线不支持流向分析");
                    }else{
                        createPipe(record,flowDirect,objKey,layerCode);
                    }
                }

            }
        }
        earth.DatabaseManager.GetXml(strConn);
    }

    /**
     * 查看单根管线的流向
     * @return {[type]} [description]
     */
    var singleFlowShowing = function(){
        var earth = top.LayerManagement.earth;
        earth.Event.OnPickObjectEx = onPickObjectEx;//获取的为一般的数据
        earth.Query.PickObjectEx(24);//设置选取对象的类型
        closeSingleFlowing();
    };
    FlowDirection.singleFlowShowing = singleFlowShowing;
})();
