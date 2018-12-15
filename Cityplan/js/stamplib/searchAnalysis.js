/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月9日
 * 描    述：查询分析
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */

// 改变窗口大小时，结果栏高度自适应
$(window).resize(function(){
    try{
        setDivHeight(); // easyui datagrid高度自适应
        $("#dg").datagrid('resize',{
            height:$("#dgDiv").height()
        });
    } catch(e){
        
    }
});

jQuery.support.cors = true; //开启jQuery跨域支持
var balanceBalloon = null;//用地平衡气泡
var elementPolygon = null;//限高分析、指标核算、绿地分析、选址分析、拆迁分析绘制的多边形

if (!STAMP) {
    var STAMP = {};
}

STAMP.searchAnalysis = function (earth) {
    var searchAnalysis = {};
    var htmlBallon = null;//弹出气泡对象
    var leftBalloon = null;//绿地分析、选址分析等生成的左侧气泡
    var location = {};
    var prePickObj;
    var highLightObjs = [];
    var balloonAlpha = 0xcc;
    if (top.SYSTEMPARAMS && top.SYSTEMPARAMS.balloonAlpha && !isNaN(top.SYSTEMPARAMS.balloonAlpha)) {
        balloonAlpha = top.SYSTEMPARAMS.balloonAlpha;
    }

    /**
     * 调用气泡方法
     * @param  {[type]} path     [html名称]
     * @param  {[type]} obj      [当先查询对象数据集合以及一些字段映射转换的方法]
     * @param  {[type]} position [经纬度]
     * @param  {[type]} width    [气泡宽高]
     * @param  {[type]} height   [气泡宽高]
     * @return {[type]}          [description]
     */
    var createHtmlBollon = function (path, obj, position, width, height) {
        var loaclUrl = window.location.href.substring(0, window.location.href.lastIndexOf("/"));
        var url = loaclUrl + "/" + path; //ShowNavigate只能用绝对路径
        if (htmlBallon) {
            htmlBallon.DestroyObject();
            htmlBallon = null;
        }
        var guid = earth.Factory.CreateGuid();
        htmlBallon = earth.Factory.CreateHtmlBalloon(guid, "balloon");
        htmlBallon.SetSphericalLocation(position.lon, position.lat, position.alt);
        
        var color = parseInt("0xcc4d514a ");
        htmlBallon.SetTailColor(color);
        htmlBallon.SetIsAddCloseButton(true);
        htmlBallon.SetIsAddMargin(true);
        htmlBallon.SetRectSize(width, height);
        htmlBallon.SetIsAddBackgroundImage(true);
        htmlBallon.SetBackgroundAlpha(0xcc);
        if (top.SYSTEMPARAMS.balloonAlpha >0 ) {
            htmlBallon.SetIsTransparence(true);
        } else {
            htmlBallon.SetIsTransparence(false);

        }
        htmlBallon.ShowNavigate(url);

        earth.Event.OnDocumentReadyCompleted = function (guid) {//气泡加载完成
            if (htmlBallon.Guid == guid) {
                htmlBallon.InvokeScript("postData", obj);
            }
            earth.Event.OnDocumentReadyCompleted = function () {};
        };

        earth.Event.OnHtmlBalloonFinished = function () {//气泡关闭
            for (var i = highLightObjs.length - 1; i >= 0; i--) {
                highLightObjs[i].StopHighLight();//清除高亮
            }
            if (htmlBallon != null) {
                htmlBallon.DestroyObject();
                htmlBallon = null;
            }
            earth.ToolManager.SphericalObjectEditTool.Browse();//清除掉鼠标状态
            earth.Event.OnSelectChanged = function () {};
            earth.Event.OnHtmlBalloonFinished = function () {};
        }
    }

    //清除气泡以及三维球上的多边形
    var clear = function () {
        if (htmlBallon) {
            htmlBallon.DestroyObject();
            htmlBallon = null;
        }
        if (prePickObj) {
            prePickObj.StopHighLight();
        }
        if (earth.ShapeCreator) {
            earth.ShapeCreator.Clear();
        }
        if (leftBalloon) {
            leftBalloon.DestroyObject();
            leftBalloon = null;
        }
        if (bufPolygon) {
            earth.DetachObject(bufPolygon);
            bufPolygon = null;
        }
        if (elementPolygon) {//导入shp或者输入坐标生成的
            earth.DetachObject(elementPolygon);
            elementPolygon = null;
        }
        try {
            if (elList) {//详细信息生成的图形
                while (elList.length > 0) {
                    var el = elList.pop();
                    if (el) {
                        earth.DetachObject(el);
                    }
                }
            }
        } catch (e) {
        }
    };

    /*
     * 双击定位的清除
     * 清除产生的气泡以及详细信息生辰的图形
     */
    var dblClickClear = function () {
        if (htmlBallon) {
            htmlBallon.DestroyObject();
            htmlBallon = null;
        }
        try {
            if (elList) {//详细信息生成的图形
                while (elList.length > 0) {
                    var el = elList.pop();
                    if (el) {
                        earth.DetachObject(el);
                    }
                }
            }
        } catch (e) {

        }
    };

    /**
     * 将X,Y,Z构造一个vector3对象
     * @param  {[type]} x [X坐标]
     * @param  {[type]} y [Y坐标]
     * @param  {[type]} z [Z坐标]
     * @return {[type]}   [返回vector3对象]
     */
    var _tov3 = function (x, y, z) {
        var v3 = earth.Factory.CreateVector3();
        v3.X = x;
        v3.Y = y;
        v3.Z = z;
        return v3;
    }

    //判断两个vector3是否相等
    //如果相等返回true,不相等返回false
    var _eq_v3 = function (v1, v2) {
        if (!v1 || !v2) {
            return false;
        }
        if (v1.X == v2.X && v1.Y == v2.Y && v1.Z == v2.Z) {
            return true;
        }
        return false;
    }

    //解析数据
    //data:服务返回xml，layerID图层guid
    var parseData = function (data, layerId) {
        var dataDoc = loadXMLStr(data);
        if (!dataDoc || dataDoc.xml == '') {
            return {
                total: 0,
                rows: []
            };
        }
        var data = $.xml2json(dataDoc);
        if (!data) {
            return {
                total: 0,
                rows: []
            };
        }

        var geoType = data.Result.geometry;
        var records = data.Result.Record;
        if (records == undefined) {
            return {
                total: 0,
                rows: []
            };
        }
        if (!$.isArray(records)) {
            records = [records];
        }
        var rows = [];
        var total = parseInt(data.Result.num);
        var dataType = earth.LayerManager.GetLayerByGuid(layerId).DataType;
        for (var i = 0; i < records.length; i++) {
            var obj = {};
            for (var k in records[i]) {
                obj[k] = records[i][k];
            }
            obj['__attr__'] = {
                layerId: layerId,
                dataType: dataType
            };
            obj['__detailBtn__'] = '详情';

            try {
                var d = dataDoc.getElementsByTagName("Record")[i];
                d.setAttribute('dataType', dataType);
                var geoType = dataDoc.getElementsByTagName("Result")[0].getAttribute("geometry");
                var coors = d.getElementsByTagName("Coordinates")[0].text;
                obj['__info__'] = {
                    type: geoType,
                    coors: coors,
                    data: d
                };
            } catch (e) {

            }

            var sfs = ['CODE', 'NAME'];
            for (var j = 0; j < sfs.length; j++) {
                var tf = top.mapMgr.getTrueField(sfs[j], dataType);
                if (obj[sfs[j]] == undefined) {
                    obj[sfs[j]] = obj[tf];
                }
            }
            rows.push(obj);
        }

        return {
            total: total,
            rows: rows
        };
    }

    //根据V3s集合构造查询条件并且绘制出图形
    //fearture:v3s集合；type:类型
    var createElement = function (feature, type) {
        var str = '';
        var guid = earth.Factory.CreateGuid();
        if (type == 'circle') {
            str = '(3,0,';
            str += feature.Radius + ',';
            str += feature.Longitude + ',' + feature.Latitude;
            str += ')';
            elementPolygon = earth.Factory.CreateElementCircle(guid, "circle");
            var tran = elementPolygon.SphericalTransform;
            tran.SetLocationEx(feature.Longitude, feature.Latitude, feature.Altitude);
            elementPolygon.BeginUpdate();
            //新增属性
            elementPolygon.Selectable = false;
            elementPolygon.Editable = false;
            elementPolygon.AltitudeType = 1;
            elementPolygon.Radius = feature.Radius;
            elementPolygon.FillStyle.FillColor = parseInt("0x3200ff00");
            elementPolygon.LineStyle.LineWidth = 1;
            elementPolygon.LineStyle.LineColor = parseInt("0xffc0c0c0");
            elementPolygon.EndUpdate();
            earth.AttachObject(elementPolygon);
        } else if (type == 'polygon') {
            str = '';
            for (var i = 0; i < feature.Count; i++) {
                str += feature.Items(i).X + ',' + feature.Items(i).Y + ',0,';
            }
            str = str.substr(0, str.length - 1);
            str = '(2' + ',' + feature.Count + ',' + str + ')';
            elementPolygon = earth.Factory.CreateElementPolygon(guid, "polygon");
            elementPolygon.BeginUpdate();
            elementPolygon.SetExteriorRing(feature);
            elementPolygon.LineStyle.LineWidth = 1;
            elementPolygon.LineStyle.LineColor = parseInt("0xffc0c0c0");
            elementPolygon.AltitudeType = 1;
            elementPolygon.FillStyle.FillColor = parseInt("0x3200ff00");
            elementPolygon.DrawOrder = 0;
            elementPolygon.Selectable = false;
            elementPolygon.Editable = false;
            elementPolygon.EndUpdate();
            earth.AttachObject(elementPolygon);
        } else if (type == 'all') {
            str = '';
        }
        return str;
    }

    //通过查询条件构造服务查询数据
    //layerId:图层guid;pc:要查询的字段过滤条件;sc要查询的空间过滤条件;pn:第几页;ps:每页条数
    var getGeoData = function (layerId, pc, sc, pn, ps) {
        if (!layerId) {
            alert('请指定目标图层');
            return null;
        }

        if (typeof pc != 'string') {
            return null;
        }
        pc = (pc == '') ? '' : ('&pc=' + pc);
        if (typeof sc != 'string') {
            return null;
        }
        sc = (sc == '') ? '' : ('&sc=' + sc);
        pn = pn || 0;
        ps = ps || 10;
        var paramIp = top.STAMP_config ? top.STAMP_config.server.serviceIP : STAMP_config.server.serviceIP;
        var url = paramIp + '/geoserver?service=' + layerId +
            pc + sc + '&qt=17&pg=' + pn + ',' + ps;
        var geoData = '';
        $.ajax({
            type: 'GET',
            dataType: 'text',
            url: url,
            async: false,
            cache: false,
            success: function (data, textStatus, jqXHR) {
                geoData = data;
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                geoData = '';
            }
        });

        return geoData;
    }

    //查询某行数据的具体信息
    //layerId:图层guid;key:字段名称;value:值
    //返回:有数据返回查询结果,没数据返回null
    var getGeoDetail = function (layerId, key, value) {
        if (!layerId) {
            alert('请指定目标图层');
            return null;
        }
        if (!key) {
            key = 'CODE';
        }
        if (!value) {
            alert('请指定目标记录');
            return null;
        }
        var dataType = earth.LayerManager.GetLayerByGuid(layerId).DataType;
        var tf = top.mapMgr.getTrueField(key, dataType);
        var pc = '&pc=(and,equal,' + tf + ',' + value + ')';
        var url = top.STAMP_config.server.serviceIP + "/geoserver?service=" + layerId + pc + "&qt=17&pg=0,1";
        var dataDoc = null;
        $.ajax({
            type: 'GET',
            dataType: 'text',
            url: url,
            async: false,
            cache: false,
            success: function (data, textStatus, jqXHR) {
                dataDoc = loadXMLStr(data);
                if (!dataDoc) {
                    return;
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                dataDoc = null;
            }
        });
        if (!dataDoc || dataDoc.xml == '') {
            alert('未获取到结果，可能是网络原因，请稍后再试');
            return null;
        }
        try {
            var data = dataDoc.getElementsByTagName("Record")[0];
            data.setAttribute('dataType', dataType);
            var geoType = dataDoc.getElementsByTagName("Result")[0].getAttribute("geometry");
            var coors = data.getElementsByTagName("Coordinates")[0].text;
            return {
                type: geoType,
                coors: coors,
                data: data
            };
        } catch (e) {
            alert('未获取到结果，可能是网络原因，请稍后再试!');
            return null;
        }
    }

    //将查询结果展示在dg中
    //layerId:图层guid;pc:字段过滤条件;sc:空间过滤条件;pn:第几页;ps:每页条数
    var showData = function (layerId, pc, sc, pn, ps) {
        var data = getGeoData(layerId, pc, sc, pn - 1, ps);//构造条件发送请求得到xml数据
        if (!data) {
            return;
        }
        data = parseData(data, layerId);//将数据解析为datagrid可加载的数据
        if (pn == 1) {//如果是第一次查询，将总数赋给totalNum
            totalNum = data.total;
        } else {//后面则直接取变量即可
            data.total = totalNum;
        }
        if (!totalNum) {
            alert("无查询数据");
        }
        if (lastResult) {//上一次加载有数据需要把生成的滚动条销毁掉防止下一次没数据报错
            $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
        }
        $("#dg").datagrid("loadData", data.rows);
        if (data.rows.length) {//有数据要重新生成滚动条
            $($(".datagrid-body")[1]).mCustomScrollbar();
            lastResult = true;
        } else {
            lastResult = false;
        }

        var p = $("#dg").datagrid('getPager');
        p.pagination({
            total: data.total,
            pageNumber: pn
        });
    };

    /**
     * 在气泡中显示具体信息
     * @param obj 具体信息集合
     */
    var showInfo = function (obj) {
        dblClickClear();
        if (!obj) {
            return;
        }
        var lon = null;
        var lat = null;
        var alt = null;
        if (obj.type.toLowerCase() == "polygon") {//多边形
            var v3sList = _coors2v3sList(obj.coors, 'polygon');//将坐标串转换为v3s集合的数组
            if (v3sList != null && v3sList.length > 0) {
                for (var i in v3sList) {
                    var p = _createPolygon(v3sList[i]);//绘制多边形
                    elList.push(p);
                }
            }
            //获取图形中心点start
            var vecs = obj.coors.split(",");
            var v3s = earth.Factory.CreateVector3s();
            for (var j = 0; j < vecs.length; j += 3) {
                var v3 = earth.Factory.CreateVector3();
                v3.X = vecs[j];
                v3.Y = vecs[j + 1];
                v3.Z = vecs[j + 2];
                v3s.AddVector(v3);
            }
            var el = earth.Factory.CreateElementPolygon(earth.Factory.CreateGUID(), "");
            el.BeginUpdate();
            el.SetExteriorRing(v3s);
            el.LineStyle.LineWidth = 1;
            el.LineStyle.LineColor = 0xffff0000;
            el.FillStyle.FillColor = 0x2500ff00;
            el.AltitudeType = 1;
            el.Visibility = true;
            el.EndUpdate();
            lon = el.SphericalTransform.Longitude;
            lat = el.SphericalTransform.Latitude;
            alt = el.SphericalTransform.Altitude;
            //获取图形中心点end
        } else if (obj.type.toLowerCase() == "point") {//查出来的对象是点
            var arr = obj.coors.split(",");
            lon = parseFloat(arr[0]);
            lat = parseFloat(arr[1]);
            alt = parseFloat(arr[2]);
        } else if (obj.type.toLowerCase() == "polyline") {//查出来的对象是线
            var vecs = obj.coors.split(",");
            var v3s = earth.Factory.CreateVector3s();
            for (var j = 0; j < vecs.length; j += 3) {
                var v3 = earth.Factory.CreateVector3();
                v3.X = vecs[j];
                v3.Y = vecs[j + 1];
                v3.Z = vecs[j + 2];
                v3s.AddVector(v3);
            }
            var el = earth.Factory.CreateElementLine(earth.Factory.CreateGUID(), "");
            el.BeginUpdate();
            el.SetPointArray(v3s);
            el.LineStyle.LineWidth = 1;
            el.LineStyle.LineColor = 0xffff0000;
            el.AltitudeType = 1;
            el.Visibility = true;
            el.EndUpdate();
            elList.push(el);
            lon = el.SphericalTransform.Longitude;
            lat = el.SphericalTransform.Latitude;
            alt = el.SphericalTransform.Altitude;
        }
        for (var i in elList) {//将所有的对象添加在三维球中
            var el = elList[i]
            if (el) {
                earth.AttachObject(el);
                el.HightLightIsFlash(true);
                el.ShowHighLight();
            }
        }

        earth.GlobeObserver.FlytoLookat(lon, lat, alt, 0, 60, 0, 100, 2);
        var location = {
            lon: lon,
            lat: lat,
            alt: alt
        };
        var infoData = {
            node: obj.data,
            mapMgr: top.mapMgr//字段映射方法集合
        };
        if(top.SYSTEMPARAMS.balloonAlpha > 0){
            searchAnalysis.createHtmlBollon("searchDataTable1.html", infoData, location, 310, 260);
        }else{
            searchAnalysis.createHtmlBollon("searchDataTable.html", infoData, location, 350, 300);
        }
    };

    /**
     *将坐标字符串转化为vector3s对象数组
     * @param coors 坐标字符串
     * @param type 面polygon 线polyline 点point
     * @returns {*}
     * @private
     */
    var _coors2v3sList = function (coors, type) {
        if (!coors) {
            return null;
        }
        var c = coors.split(',');
        var v3sList = [];
        if (type == 'polygon') {//如果是多边形
            var r = [];
            for (var i = 0; i < c.length; i += 3) {
                var v3s = earth.Factory.CreateVector3s();
                var v1 = _tov3(c[i], c[i + 1], c[i + 2]);
                v3s.AddVector(v1);
                for (var j = i + 3; j < c.length; j += 3) {
                    var v2 = _tov3(c[j], c[j + 1], c[j + 2]);
                    v3s.AddVector(v2);
                    if (_eq_v3(v1, v2)) {
                        r.push(v3s);
                        i = j;
                        break;
                    }
                }
                if (j >= c.length) {
                    v3sList.push(r);
                    r = [];
                }
            }
            v3sList.push(r);
        }
        return v3sList;
    }

    //根据vector3s对象绘制多边形
    //v3sList:vector3s对象数组
    var _createPolygon = function (v3sList) {
        if (v3sList == null || v3sList.length == 0) {
            return null;
        }
        var el = earth.Factory.CreateElementPolygon(earth.Factory.CreateGUID(), '');
        el.BeginUpdate();
        el.SetExteriorRing(v3sList[0]);
        el.LineStyle.LineWidth = 1;
        el.LineStyle.LineColor = 0xffff0000;
        el.FillStyle.FillColor = 0x2500ff00;
        el.AltitudeType = 1;
        el.Visibility = true;
        el.EndUpdate();
        return el;
    }

    /**
     * 显示左侧气泡
     * @param  {[type]} obj          [description]
     * @param  {[type]} maxNumLength [description]
     * @return {[type]}              [description]
     */
    var showLeftBalloon = function (obj, maxNumLength ) {
        if (leftBalloon) {
            leftBalloon.DestroyObject();
            leftBalloon = null;
        }
        var guid = earth.Factory.CreateGuid();
        leftBalloon = earth.Factory.CreateHtmlBalloon(guid, "balloon");
        

        leftBalloon.SetIsAddCloseButton(true);
        leftBalloon.SetIsAddMargin(true);
        leftBalloon.SetIsAddBackgroundImage(true);
        leftBalloon.SetBackgroundAlpha(0xcc);
        var fontColor = top.SYSTEMPARAMS.balloonAlpha > 0?"#fffffe" : "black";
        var numColor = top.SYSTEMPARAMS.balloonAlpha > 0?"#ffff00" : "#DC7623";
        var divWidth = 130 + maxNumLength * 12;
        var str = "<div style='overflow: auto;width: "+ divWidth +"px;background-color: #ffffff;'><table style='font: 14px Microsoft Yahei;color: "+ fontColor +";word-break:break-all'>";
        for (var i = 0; i < obj.length; i++) {
            str += "<tr><td style='height: 20px;line-height: 20px;'>" + obj[i][0] + ":</td><td style='color: "+ numColor +";font-weight: bold;word-break: break-all;'>" + obj[i][1] + "</td><td>" + obj[i][2] + "</td></tr>";
        }
        str += "</table></div>"
        if (top.SYSTEMPARAMS.balloonAlpha > 0) {
            leftBalloon.SetIsTransparence(true);
            var height = 30 + obj.length * 24;
            var width = 150 + maxNumLength * 12;
            leftBalloon.SetRectSize(width, height);
        } else {
            leftBalloon.SetIsTransparence(false);
            var height = 90 + obj.length * 28;
            var width = 220 + maxNumLength * 15;
            leftBalloon.SetRectSize(width, height);
        }

        if (top.ViewTranSettingBtn) {
            var leftDis = 440 + width / 2;
            leftBalloon.SetScreenLocation(leftDis, 0);
        } else {
            var leftDis = 90 + width / 2;
            leftBalloon.SetScreenLocation(leftDis, 0);
        }
        leftBalloon.ShowHtml(str);
        top.Stamp.Tools.OnHtmlBalloonFinishedFunc(guid, function (closeBid) {
            if (leftBalloon != null) {
                leftBalloon.DestroyObject();
                leftBalloon = null;
            }
        });
    }

    /**
     * 弹出用地平衡窗口
     * @param  {[type]} p      [查询范围]
     * @param  {[type]} menuId [菜单ID]
     * @return {[type]}        [description]
     */
    var showBalanceBalloon = function (p, menuId) {
        var loaclUrl = window.location.href.substring(0, window.location.href.lastIndexOf("/"));
        var url = loaclUrl + "/html/aidedPlan/balance.html"
        var width = 800;
        var height = 500;
        balanceBalloon = earth.Factory.CreateHtmlBalloon(earth.Factory.CreateGuid(), "");
        balanceBalloon.SetScreenLocation(490, 0); 
        balanceBalloon.SetRectSize(width, height);
        balanceBalloon.SetIsAddBackgroundImage(false);
        balanceBalloon.ShowNavigate(url);
        earth.Event.OnDocumentReadyCompleted = function (guid) {
            var searchAna = STAMP.searchAnalysis(earth);
            earth.searchAnalysis = searchAna;
            earth.htmlBalloon = balanceBalloon;
            earth.ctrPlanLayer = top.ctrPlanLayer;
            earth.mapMgr = top.mapMgr;
            earth.pVal = p;
            if (balanceBalloon === null) {
                return;
            }
            if (balanceBalloon.Guid == guid) {
                balanceBalloon.InvokeScript("getEarth", earth);
            }
        };
        earth.Event.OnHtmlBalloonFinished = function (id) {
            if (balanceBalloon != null && id === balanceBalloon.Guid) {
                balanceBalloon.DestroyObject();
                balanceBalloon = null;
                Tools.singleStyleCancel(menuId);
                earth.Event.OnHtmlBalloonFinished = function () {
                };
            }
        };
    }

    //获取值域
    //layerId:图层guid,field:要查询值域的字段名
    //返回参数:查到返回值域数组,没查到返回null
    var getValueRange = function (layerId, field) {
        if (!layerId) {
            alert('请指定目标图层');
            return null;
        }
        if (!field) {
            alert('请指定目标字段');
            return null;
        }

        var url = top.STAMP_config.server.serviceIP + "/geoserver?service=" + layerId + '&fd=' + field +
            '&qt=256&time=' + new Date();
        var dataDoc = null;
        $.ajax({
            type: 'GET',
            dataType: 'text',
            url: url,
            async: false,
            cache: false,
            success: function (data, textStatus, jqXHR) {
                dataDoc = loadXMLStr(data);
                if (!dataDoc) {
                    return;
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                dataDoc = null;
            }
        });
        if (!dataDoc || dataDoc.xml == '') {
            alert('未获取到值域，可能是网络原因，请稍后再试');
            return null;
        }
        var data = $.xml2json(dataDoc);
        try {
            var valueRange = data.ValueRangeResult.ValueRange.Value;
            if (!$.isArray(valueRange)) {
                valueRange = [valueRange];
            }
            return valueRange;
        } catch (e) {
            return null;
        }
    };

    /* ------------------------------------------------------------------------*/
    //用地平衡开始
    /* ------------------------------------------------------------------------*/
    var ctrPlanSeach = function (id) {
        if (balanceBalloon) {
            balanceBalloon.DestroyObject();
            balanceBalloon = null;
        }
        var flag = Tools.toolBarItemClickStyle(id);
        if(!flag){
            earth.ShapeCreator.Clear();
            return;
        }
        earth.Event.OnCreateGeometry = function (p, cType) {
            if (p.Count < 3) {
                alert("请至少绘制3个点");
                earth.ShapeCreator.Clear();
                Tools.singleStyleCancel(id);
            } else {
                showBalanceBalloon(p, id);
            }
        }
        earth.ShapeCreator.CreatePolygon();
    }
    /* ------------------------------------------------------------------------*/
    //用地平衡结束
    /* ------------------------------------------------------------------------*/

    searchAnalysis.ctrPlanSeach = ctrPlanSeach;
    searchAnalysis.getValueRange = getValueRange;
    searchAnalysis.createHtmlBollon = createHtmlBollon;
    searchAnalysis.clear = clear;
    searchAnalysis.showInfo = showInfo;
    searchAnalysis.getGeoDetail = getGeoDetail;
    searchAnalysis.getGeoData = getGeoData;
    searchAnalysis.showData = showData;
    searchAnalysis.parseData = parseData;
    searchAnalysis.createElement = createElement;
    searchAnalysis.showLeftBalloon = showLeftBalloon;
    return searchAnalysis;
};