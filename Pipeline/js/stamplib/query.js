/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：查询方法封装
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
// easyui datagrid高度自适应
$(window).resize(function() {
    try {
        $("#dg").datagrid('resize', {
            height: $("#dgDiv").height()
        });
    } catch (e) {

    }
})

var bufPolygon = null; //交叉口查询、行政查询统计、道路查询统计生成的缓冲面
var selectedObj = null; //生成缓冲面需要的geopoints
var radius = 3; //生成缓冲面需要的缓冲半径
var thisSpatial = null; //交叉口查询、行政查询统计、道路查询统计生成的缓冲范围的vector3s矢量对象,也就是查询和统计需要的空间对象
var pageCount = 1; //用于道路查询、行政查询等过滤按钮查询列表进行分页，pageCount为查询结果的总页数；
//参数：radius--道路缓冲半径，主要用于分析
var timer = null;
var html = null; //导出时拼接字符串，一次渲染dom节点
var QueryObject = {
    /**
     * 设置缓冲半径
     * @param {[number]} r    [缓冲半径]
     * @param {[string]} type [类型,如果是行政区一类的则不会出现半径,因为多边形往外括有Bug]
     */
    setRadius: function(r, type) {
        if (type) {
            if (isNaN(r) || r < 0 || r == "") {
                r = 0.1;
            }
        } else {
            if (isNaN(r) || r < 0 || r == "") {
                r = 0;
            }
        }
        radius = r;
    },
    /**
     * 获取每页条数
     * @return {[nUmber]} [每页条数]
     */
    getPageCount: function() {
        return pageCount;
    },
    /**
     * 查询道路、交叉口或者行政区
     * @param  {[object]} tab             [要添加html字符串的容器对象]
     * @param  {[string]} service         [要查哪一个:canton,road]
     * @param  {[string]} canton          [行政区]
     * @param  {[string]} projectId       [当前工程的Id]
     * @param  {[string]} cross           [过滤条件]
     * @param  {[number]} ns              [第几页]
     * @param  {[number]} nc              [每页条数]
     * @param  {[Boolean]} bClickFilter    [是否需要调用分页控件]
     * @param  {[funtion]} pagePagination  [分页方法]
     * @param  {[number]} pageIndex2      [总页数]
     * @param  {[function]} pagePagination2 [分页控件函数]
     */
    getTypeQuery: function(tab, service, canton, projectId, cross, ns, nc, bClickFilter, pagePagination, pageIndex2, pagePagination2) { //道路查询、行政查询等区域查询用到
        var numStart = ns ? ns : 0; //快速定位第几页
        var numCount = nc ? nc : 1000; //快速定位每页显示条数
        var mQueryString;
        if (canton === "" || canton === null || canton === undefined) { //查询所有
            mQueryString = top.params.ip + "/dataquery?service=" + service + "&qt=16&fd=NAME&project=" + projectId;
        } else { //模糊查询
            mQueryString = top.params.ip + "/dataquery?service=" + service + "&qt=16&fd=NAME&project=" + projectId + "&pc=(and,like,NAME," + canton + ")";
        }
        mQueryString += "&pg=" + numStart + "," + numCount;
        earth.Event.OnEditDatabaseFinished = function(pRes, pFeature) {
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                var xmlDoc = loadXMLStr(xmlStr);
                var json = $.xml2json(xmlDoc);
                if (json == null) {
                    alert("请配置数据!");
                    return null;
                }
                var records = json.Result.Record;
                var pointType;
                if (json.Result.num <= 0) {
                    if (bClickFilter) {
                        pagePagination(0, 1);
                    }
                    alert("无查询数据")
                    return null;
                } else if (json.Result.num == 1) {
                    records = [records];
                }
                pageCount = Math.ceil(json.Result.num / numCount);
                var isAddBackground = true;
                for (var i = 0; i < records.length; i++) {
                    var record = records[i];
                    if (record.NAME != "") {
                        var template = '';
                        var tdid = "tdtd" + i;
                        if (isAddBackground) {
                            var tdid = "tdtd" + i;
                            template = '<tr ondblclick=QueryObject.QuerySelectedArea("' + service + '","' + projectId + '","' + record.NAME + '") ><td id="' + tdid + '" style="width: 125px" class="trbg">' + record.NAME + '</td></tr>';
                            isAddBackground = false;
                        } else {
                            template = '<tr ondblclick=QueryObject.QuerySelectedArea("' + service + '","' + projectId + '","' + record.NAME + '") ><td id="' + tdid + '" style="width: 125px">' + record.NAME + '</td></tr>';
                        }
                        tab.append(template);
                        $("#" + tdid).live("click", function() {
                            var me = this;
                            if (timer) {
                                clearTimeout(timer);
                            }
                            timer = setTimeout(function() {
                                QueryObject.selectTr(me, cross, projectId, pageIndex2, numCount, pagePagination2, true);
                            }, 300);
                        });
                    }
                }

                if (cross) {
                    QueryObject.getRoadCross($(".trbg").html(), projectId, pageIndex2, numCount, pagePagination2, true);
                }
                if (bClickFilter) {
                    pagePagination(json.Result.num, pageCount);
                }
            }
        }
        earth.DatabaseManager.GetXml(mQueryString);
    },
    /**
     * 道路、行政、单位定位
     * @param {[string]}   service   [服务地址]
     * @param {[string]}   projectId [工程guid]
     * @param {[string]}   selName   [道路名称]
     * @param {Function} callback  [回调函数,可能是道路查询、统计或者行政区统计]
     */
    QuerySelectedArea: function(service, projectId, selName, callback) {
        var mQueryString = top.params.ip + "/dataquery?service=" + service + "&qt=17&fd=NAME&project=" + projectId + "&pc=(and,equal,NAME," + selName + ")&pg=0,10";
        earth.Event.OnEditDatabaseFinished = function(pRes, pFeature) {
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                var xmlDoc = loadXMLStr(xmlStr);
                var json = $.xml2json(xmlDoc);
                if (json == null) {
                    divloaded();
                    return null;
                }
                var records = json.Result.Record;
                var pointType;
                if (json.Result.num <= 0) {
                    divloaded();
                    return null;
                } else if (json.Result.num == 1) {
                    pageCount = 1;
                    if (records == null || records.SHAPE == null) {
                        divloaded();
                        return;
                    }
                    var coordinatesType = records.SHAPE.Polygon;
                    pointType = "Polygon";
                    if (!coordinatesType) {
                        coordinatesType = records.SHAPE.Polyline;
                        pointType = "Polyline";
                    }
                    if (!coordinatesType) {
                        coordinatesType = records.SHAPE.Point;
                        pointType = "Point";
                    }
                    var coordinates = coordinatesType.Coordinates;
                    QueryObject.flyToBuffer(coordinates, service);
                    if (typeof callback == "function") {
                        callback();
                    }
                } else {
                    pageCount = 1;
                    var record = records[0];
                    if (record == null || record.SHAPE == null) {
                        divloaded();
                        return;
                    }
                    var coordinatesType = record.SHAPE.Polygon;
                    pointType = "Polygon";
                    if (!coordinatesType) {
                        coordinatesType = record.SHAPE.Polyline;
                        pointType = "Polyline";
                    }
                    if (!coordinatesType) {
                        coordinatesType = record.SHAPE.Point;
                        pointType = "Point";
                    }
                    var coordinates = coordinatesType.Coordinates;
                    QueryObject.flyToBuffer(coordinates, service);
                    if (typeof callback == "function") {
                        callback();
                    }
                }
            }
        }
        earth.DatabaseManager.GetXml(mQueryString);
    },
    /**
     * 交叉口查询需要的,点击上一条路获取到交叉道路
     * @param  {[string]} id              [点击的tr的id]
     * @param  {[strIng]} cross           [交叉路,如果没有则不用继续查询交叉的道路]
     * @param  {[string]} projectId       [当前工程id]
     * @param  {[number]} pageIndex2      [总页数]
     * @param  {[number]} pageCount       [每页条数]
     * @param  {[function]} pagePagination2 [分页控件调用的方法]
     * @param  {[Boolean]} bRefresh        [是否需要刷新分页控件]
     */
    selectTr: function(id, cross, projectId, pageIndex2, pageCount, pagePagination2, bRefresh) {
        if ($(id).hasClass('trbg')) {
            return;
        }
        $(".trbg").each(function() {
            $(this).removeClass("trbg");
        });
        $(id).addClass("trbg");
        if (cross != null) {
            var roadName = $(id).html();
            this.getRoadCross(roadName, projectId, pageIndex2, pageCount, pagePagination2, bRefresh);
        }
    },
    /**
     * 交叉路口交叉路tr点击事件,给点击的tr加上背景颜色
     * @param  {[string]} id [点击的tr的id]
     */
    selectTr2: function(id) {
        $(".trbg2").each(function() {
            $(this).removeClass("trbg2");
        });
        $(id).addClass("trbg2");

    },
    /**
     * 获取交叉道路
     * @param  {[strIng]} roadName        [需要查询交叉路的路名]
     * @param  {[string]} projectId       [当前工程id]
     * @param  {[number]} pageIndex2      [交叉道路的起始页码]
     * @param  {[number]} pageCount       [每页条数]
     * @param  {[function]} pagePagination2 [交叉道路的分页控件方法]
     * @param  {[Blooear]} bRefresh        [是否需要调用分页控件]
     */
    getRoadCross: function(roadName, projectId, pageIndex2, pageCount, pagePagination2, bRefresh) { //交叉口查询
        var numStart = pageIndex2 ? pageIndex2 : 0; //快速定位第几页
        var numCount = pageCount ? pageCount : 1000; //快速定位每页显示条数
        var url = top.params.ip;
        var tab = $("#tabList2");
        tab.empty();
        url += "/dataquery?service=road";
        url += "&qt=16";
        url += "&project=" + projectId;
        url += "&cc=(road," + roadName + ",1)";
        url += "&pg=" + numStart + "," + numCount;
        earth.Event.OnEditDatabaseFinished = function(pRes, pFeature) {
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                tab.empty();
                var xmlStr = pRes.AttributeName;
                var xmlDoc = loadXMLStr(xmlStr);
                var json = $.xml2json(xmlDoc);
                if (json == null) {
                    return;
                }
                var records = json.Result.Record;
                if (json.Result.num <= 0) {
                    return;
                } else if (json.Result.num == 1) {
                    if (records.NAME == roadName) {
                        return;
                    }
                    var template = '<tr ondblclick=QueryObject.QuerySelectedArea("road","' + projectId + '","' + records.NAME + '")><td class="trbg2" onclick=QueryObject.selectTr2(this)' + ' style="width: 125px">' + records.NAME + '</td></tr>';
                    tab.append(template);
                } else {
                    var isAddBackground = true;
                    for (var i = 0; i < records.length; i++) {
                        var record = records[i];
                        if (record.NAME != "" && record.NAME != roadName) {
                            var template;
                            if (isAddBackground) {
                                template = '<tr ondblclick=QueryObject.QuerySelectedArea("road","' + projectId + '","' + record.NAME + '") ><td class="trbg2" onclick=QueryObject.selectTr2(this) ' + ' style="width: 125px">' + record.NAME + '</td></tr>';
                                isAddBackground = false;
                            } else {
                                template = '<tr ondblclick=QueryObject.QuerySelectedArea("road","' + projectId + '","' + record.NAME + '") ><td onclick=QueryObject.selectTr2(this) ' + ' style="width: 125px">' + record.NAME + '</td></tr>';
                            }
                            tab.append(template);
                        }
                    }
                }
                if (bRefresh && pagePagination2) {
                    pageCount = Math.ceil(json.Result.num / numCount);
                    pagePagination2(json.Result.num, pageCount, projectId);
                }
            }
        }
        earth.DatabaseManager.GetXml(url);
    },
    /**
     * 创建缓冲面并且定位到缓冲面
     * @param  {[type]} coordinates [description]
     * @param  {[type]} service     [description]
     * @return {[type]}             [description]
     */
    flyToBuffer: function(coordinates, service) {
        coordinates = coordinates.split(",");
        selectedObj = earth.Factory.CreateGeoPoints();
        if (coordinates.length === 3) { //认为是点 后期优化....
            //点处理 后期优化判断类型 todo:
            for (var j = 0; j < coordinates.length; j++) {
                selectedObj.Add(coordinates[j], coordinates[j + 1], coordinates[j + 2]);
                this.createBufferFromCircle(coordinates);
            }
        } else {
            for (var i = 0; i < coordinates.length; i += 3) {
                selectedObj.Add(coordinates[i], coordinates[i + 1], coordinates[i + 2]);
            }
            this.createBufferFromLine(radius, service, coordinates);
        }

    },

    /**
     * 单位查询、交叉口查询需要由点生成一个圆形的缓冲面并且定位
     * @param  {[array]} coords [点坐标数组]
     */
    createBufferFromCircle: function(coords) {
        this.clearBuffer();
        var guid = earth.Factory.CreateGuid();
        bufPolygon = earth.Factory.CreateElementCircle(guid, "circle");
        var tran = bufPolygon.SphericalTransform;
        tran.SetLocationEx(coords[0], coords[1], coords[2]);
        bufPolygon.BeginUpdate();

        //传入半径
        bufPolygon.Radius = radius;
        bufPolygon.LineStyle.LineWidth = 1;
        bufPolygon.LineStyle.LineColor = parseInt("0xFFFF0000");
        bufPolygon.FillStyle.FillColor = parseInt("0x2500FF00");
        bufPolygon.AltitudeType = 1; //贴地
        bufPolygon.EndUpdate();
        earth.AttachObject(bufPolygon);
        bufPolygon.ShowHighLight();
        //飞行定位到该点
        this.flyToModel(bufPolygon);
        var tempBufGeoPoints = earth.Factory.CreateGeoPoints();
        var vecs = earth.GeometryAlgorithm.CreatePolygonFromCircle(radius, 24);
        for (var i = 0; i < vecs.Count; i++) {
            var vec = tran.TransformCartesionToSphrerical(vecs.Items(i));
            tempBufGeoPoints.Add(vec.X, vec.Y, vec.Z);
        }
        return tempBufGeoPoints;
    },
    /**
     * 定位
     * @param  {[number]} x [经度]
     * @param  {[number]} y [纬度]
     */
    flyToPoint: function(x, y) {
        earth.GlobeObserver.FlytoLookat(x, y, 100, 0, 90, 0, 100, 3);
    },
    /**
     * 根据线绘制缓冲面并且定位,主要是针对道路
     * @param  {[number]} r           [缓冲半径]
     * @param  {[string]} service     [类型,是道路、行政区……]
     * @param  {[array]} coordinates [坐标]
     */
    createBufferFromLine: function(r, service, coordinates) {
        if (selectedObj == null) {
            return;
        }
        var vec3s = earth.Factory.CreateVector3s();
        if (service == "road") {
            var pt = null;
            var bufGeoPoints = earth.GeometryAlgorithm.CreatePolygonBufferFromPolyline(selectedObj, radius, 0, 36);

            for (var i = 0; i < bufGeoPoints.Count; i++) {
                pt = bufGeoPoints.GetPointAt(i);
                vec3s.Add(pt.Longitude, pt.Latitude, pt.Altitude);
            }
        } else if (service == "canton3" || service == "company" || service == "SurveyArea") {
            var pt = null;
            for (var i = 0; i < selectedObj.Count; i++) {
                pt = selectedObj.GetPointAt(i);
                vec3s.Add(pt.Longitude, pt.Latitude, pt.Altitude);
            }
            vec3s = earth.GeometryAlgorithm.CreateParallelPolygon(vec3s, r, 1);
        } else {
            if (coordinates) {
                for (var i = 0; i < coordinates.length; i += 3) {
                    vec3s.Add(coordinates[i], coordinates[i + 1], coordinates[i + 2]);
                }
            }

        }
        this.clearBuffer();
        bufPolygon = earth.Factory.CreateElementPolygon(earth.Factory.CreateGUID(), "");
        bufPolygon.BeginUpdate();
        bufPolygon.SetExteriorRing(vec3s);
        thisSpatial = vec3s;
        bufPolygon.LineStyle.LineWidth = 1;
        bufPolygon.LineStyle.LineColor = parseInt("0xFFFF0000");
        bufPolygon.FillStyle.FillColor = parseInt("0x2500FF00");
        bufPolygon.AltitudeType = 1;
        bufPolygon.EndUpdate();
        earth.AttachObject(bufPolygon);
        bufPolygon.ShowHighLight();
        this.flyToModel(bufPolygon);
    },
    /**
     * 定位到模型
     * @param  {[object]} obj [需要找的模型]
     */
    flyToModel: function(obj) {
        var rect = obj.GetLonLatRect();
        if (rect == null || rect == undefined) return;
        var north = Number(rect.North);
        var south = Number(rect.South);
        var east = Number(rect.East);
        var west = Number(rect.West);
        var topHeight = Number(rect.MaxHeight);
        var bottomHeight = Number(rect.MinHeight);

        var lon = (east + west) / 2;
        var lat = (south + north) / 2;
        var alt = (topHeight + bottomHeight) / 2;
        var width = (parseFloat(north) - parseFloat(south)) / 2;
        var range = width / 180 * Math.PI * 6378137 / Math.tan(22.5 / 180 * Math.PI);
        range += 100;
        earth.GlobeObserver.FlytoLookat(lon, lat, alt, 0, 60, 0, range, 3);
    },
    /**
     * 清除生成的缓冲面
     */
    clearBuffer: function() {
        if (bufPolygon != null) {
            earth.DetachObject(bufPolygon);
            bufPolygon = null;
        }
    },
    /**
     * 查询全部,主要是针对导出excel使用
     * @param  {[object]} pFeat             [空间查询条件]
     * @param  {[string]} guid              [图层guid]
     * @param  {[string]} filter            [属性过滤条件]
     * @param  {[number]} queryType         [查询类型:1,空间；16:属性；17:空间+属性]
     * @param  {[number]} queryTableType    [查询表类型:0,点；1:线]
     * @param  {[string]} compoundCondition [跨表查询条件,主要针对道路和行政区]
     * @param  {[number]} total             [总页数]
     * @param  {[Array]}  standardName      [需要显示出来的字段标准名称]
     * @param  {[string]} pointType         [一般特别的只是在附属物查询,因为一般显示都是显示特征点,只有附属物需要特殊处理]
     * @return {[string]}                   [查询结果整理后的数组]
     */
    paramQueryALL: function(pFeat, guid, filter, queryType, queryTableType, compoundCondition, total, standardName, pointType) {
        html = ''; //每次进来清空，避免重复拼接
        var layer = earth.LayerManager.GetLayerByGUID(guid);
        var subLayer = null;
        for (var i = 0, len = layer.GetChildCount(); i < len; i++) {
            subLayer = layer.GetChildAt(i);
            if (subLayer.LayerType == "Container") { // 使用具体的_container图层
                break;
            }
        }
        if (subLayer == null) {
            return;
        }
        var param = subLayer.QueryParameter;
        if (!param) {
            return;
        }
        param.ClearRanges();
        param.ClearCompoundCondition();
        param.ClearSpatialFilter();
        if (filter != null) {
            param.Filter = filter;
        } else {
            param.Filter = "";
        }
        if (pFeat != null) {
            param.SetSpatialFilter(pFeat);
        }
        if (queryTableType != null) {
            param.QueryTableType = queryTableType;
        }
        if (compoundCondition != null) {
            var cc = compoundCondition.split(",");
            param.SetCompoundCondition(cc[0], cc[1], parseFloat(cc[2]).toFixed(3));
        }
        var pageCount = 1;
        var pageSize = 2000;
        if (total && total < 2000) {
            pageSize = total;
        }
        param.QueryType = queryType;
        param.PageRecordCount = pageSize;
        var result = subLayer.SearchFromGISServer();
        if (result !== null && result.RecordCount > 0) {
            pageCount = Math.ceil(result.RecordCount / pageSize);
            for (var i = 0; i < pageCount; i++) {
                this.parseResult(result.GotoPage(i), layer, standardName, pointType);
            }
        }
        $("#importResult>tbody").append(html);
        return result;
    },
    /**
     * 解析结果,主要是在导出excel使用
     * @param  {[string]} result        [服务返回的xml字符串]
     * @param  {[object]} layer         [图层]
     * @param  {[Array ]} standardName  [需要显示的字段名称]
     * @param  {[string]} thisPointType [主要在附属物查询使用,一般显示管点默认显示特征属性.但是附属物查询需要特殊处理]
     * @return {[type]}               [description]
     */
    parseResult: function(result, layer, standardName, thisPointType) {
        if (result == null || result == "error") {
            return;
        }

        var json = $.xml2json(result);
        var type = json.Result.geometry;
        var displayType = "管线";
        type = type === "point" ? "point" : "line";
        var template = '<tr>';
        if (standardName && standardName.length > 0) {
            for (var i = 0; i < standardName.length; i++) {
                template += '<td>$' + standardName[i] + '</td>';
            }
        }
        template += '</tr>';
        var records = json.Result.Record;
        if (json.Result.num <= 0) {
            return;
        } else if (json.Result.num == 1) {
            //只有一个记录
            if (type == "point") {
                var us_key_point = top.getName("US_KEY", 0, true);
                var pointType = "管点";
                var usType = top.getName("US_PT_TYPE", 0, true);
                var usAttach = top.getName("US_ATTACHMENT", 0, true);
                var usWell = top.getName("US_WELL", 0, true);
                var layerCode = layer.PipeLineType;
                if (records[usType]) {
                    typeText = top.getCaptionByCustomValue(layerCode, "PointType", records[usType]);
                } else if (records[usAttach]) {
                    typeText = top.getCaptionByCustomValue(layerCode, "Attachment", records[usAttach]);
                } else if (records[usWell]) {
                    typeText = records[usWell];
                } else {
                    typeText = pointType;
                }
                if (thisPointType) {
                    var realType = top.getName(thisPointType, 0, true);
                    typeText = top.getCaptionByCustomValue(layerCode, realType, records[usAttach]);
                }
                html += (template.replace("$INDEX", records[us_key_point])
                    .replace("$DISPLAYTYPE", typeText)
                    .replace("$US_KEY", records[top.getName("US_KEY", 0, true)]) //编号
                    .replace("$LAYER", layer.Name));
            } else {
                var us_key_line = top.getName("US_KEY", 1, true);
                html += (template.replace("$INDEX", records[us_key_line])
                    .replace("$DISPLAYTYPE", displayType)
                    .replace("$US_KEY", us_key_line) //编号
                    .replace("$US_SIZE", records[top.getName("US_SIZE", 1, true)]) //管径
                    .replace("$US_PMATER", records[top.getName("US_PMATER", 1, true)]) //材质
                    .replace("$US_LTTYPE", records[top.getName("US_LTTYPE", 1, true)]) //埋设方式
                    .replace("$US_STATUS", records[top.getName("US_STATUS", 1, true)]) //废弃==状态
                    .replace("$LAYER", layer.Name));
            }
        } else {
            //多条记录
            for (var i = 0; i < records.length; i++) {
                if (type == "point") {
                    var pointType = "管点";
                    var us_key_point = top.getName("US_KEY", 0, true);
                    var usType = top.getName("US_PT_TYPE", 0, true);
                    var usAttach = top.getName("US_ATTACHMENT", 0, true);
                    var usWell = top.getName("US_WELL", 0, true);
                    var layerCode = layer.PipeLineType;
                    if (records[i][usType]) {
                        pointType = top.getCaptionByCustomValue(layerCode, "PointType", records[i][usType]);
                    } else if (records[i][usAttach]) {
                        pointType = top.getCaptionByCustomValue(layerCode, "Attachment", records[i][usAttach]);
                    } else if (records[i][usWell]) {
                        pointType = records[i][usWell];
                    }
                    if (thisPointType) {
                        var realType = top.getName(thisPointType, 0, true);
                        pointType = top.getCaptionByCustomValue(layerCode, realType, records[i][realType]);
                    }
                    html += (template.replace("$INDEX", records[i][us_key_point])
                        .replace("$DISPLAYTYPE", pointType) //类型
                        .replace("$US_KEY", records[i][top.getName("US_KEY", 0, true)]) //编号
                        .replace("$LAYER", layer.Name));
                } else {
                    var us_key_line = top.getName("US_KEY", 1, true);
                    html += (template.replace("$INDEX", records[i][us_key_line])
                        .replace("$DISPLAYTYPE", displayType) //类型
                        .replace("$US_KEY", us_key_line) //编号
                        .replace("$US_SIZE", records[i][top.getName("US_SIZE", 1, true)]) //管径
                        .replace("$US_PMATER", records[i][top.getName("US_PMATER", 1, true)]) //材质
                        .replace("$US_LTTYPE", records[i][top.getName("US_LTTYPE", 1, true)]) //埋设方式
                        .replace("$US_STATUS", records[i][top.getName("US_STATUS", 1, true)]) //废弃==状态
                        .replace("$LAYER", layer.Name));
                }
            }
        }
    }
};