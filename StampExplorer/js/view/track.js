/**
 * 作       者：StampGIS Team
 * 创建日期：2017年7月22日
 * 描        述：飞行路径相关功能
 * 注意事项：
 * 遗留bug：0
 * 修改日期：2017年11月6日
 ******************************************/
//全局对象不存在则新建一个
if(!STAMP) {
	var STAMP = {};
}
//给STAMP对象添加新对象方法
STAMP.TrackManager = function(earth) {
	var trackManager = {}; //飞行路径管理对象
	var xmlTrackListFile = earth.RootPath + STAMP_config.constants.TRACKFILE;
	var xmlAnimListFile = earth.RootPath + STAMP_config.constants.ANIMFILE;

	/**
	 * 给tracklist里的record节点排序
	 * @param  {[type]} s_guid   [description]
	 * @param  {[type]} d_guid   [description]
	 * @param  {[type]} moveType [description]
	 * @return {[type]}          [description]
	 */
	var _sortTrack = function(s_guid, d_guid, moveType) {
		//加载trackList.xml
		var xmlTrackData = earth.UserDocument.LoadXmlFile(xmlTrackListFile + ".xml");
		var xmlDoc = loadXMLStr(xmlTrackData);

		var sGuidNode, dGuidNode;
		var records = xmlDoc.getElementsByTagName("record");
		for(var i = records.length - 1; i >= 0; i--) {
			var guid = records[i].getAttribute("ID");
			if(guid === s_guid) {
				sGuidNode = records[i];
			} else if(guid === d_guid) {
				dGuidNode = records[i];
			}
		};

		if(sGuidNode && dGuidNode) {
			if(moveType === "prev") {
				dGuidNode.parentNode.insertBefore(sGuidNode, dGuidNode);
			} else if(moveType === "next") {
				insertAfter(sGuidNode, dGuidNode);
			};
			earth.UserDocument.SaveXmlFile(xmlTrackListFile, xmlDoc.xml);
		}
	};

	/**
	 * 把s_guid对应的station节点移动到d_guid节点的前面
	 * @param  {[type]} trackID [description]
	 * @param  {[type]} s_guid  [description]
	 * @param  {[type]} d_guid  [description]
	 * @return {[type]}         [description]
	 */
	var _sortStation = function(trackID, s_guid, d_guid, moveType, level) {

		var sGuidNode, dGuidNode;
		var savePath = xmlTrackListFile + trackID;
		var xmlPath = savePath + ".xml";
		var xml = earth.UserDocument.LoadXmlFile(xmlPath);
		var xmlDoc = loadXMLStr(xml);

		//遍历节点
		var pass = xmlDoc.getElementsByTagName("Pass");
		if(level === 3) {
			for(var i = pass.length - 1; i >= 0; i--) {
				var guid = pass[i].getAttribute("id");
				if(guid === s_guid) {
					sGuidNode = pass[i];
				} else if(guid === d_guid) {
					dGuidNode = pass[i];
				}
			};
		} else if(level === 2) {
			var nds = xmlDoc.getElementsByTagName("Track")[0].childNodes;
			for(var j = nds.length - 1; j >= 0; j--) {
				var guid = nds[j].getAttribute("id");
				if(guid === s_guid) {
					sGuidNode = nds[j];
				} else if(guid === d_guid) {
					dGuidNode = nds[j];
				}
			}
		}

		if(sGuidNode && dGuidNode) {
			if(moveType === "prev") {
				dGuidNode.parentNode.insertBefore(sGuidNode, dGuidNode);
			} else if(moveType === "next") {
				insertAfter(sGuidNode, dGuidNode);
			};
			earth.UserDocument.SaveXmlFile(savePath, xmlDoc.xml);
		}
	};

	//插入节点到目标节点后面
	function insertAfter(newElement, targetElement) {
		var parent = targetElement.parentNode;
		if(parent.lastChild == targetElement) {
			parent.appendChild(newElement);
		} else {
			parent.insertBefore(newElement, targetElement.nextSibling);
		}
	};

	/**
	 * 查询track数据
	 * @return {Array} 返回结果，如果没有查到符合条件的内容，返回空数组
	 * @private
	 */
	var _queryData = function() {
		var result = [];
		var xmlTrackData = earth.UserDocument.LoadXmlFile(xmlTrackListFile + ".xml");
		var res = $.xml2json(xmlTrackData);
		if(res && res.record) {
			if(res.record['ID']) {
				result.push({
					"ID": res.record["ID"],
					"NAME": res.record["NAME"]
				});
			} else {
				for(var r in res.record) {
					if(res.record.hasOwnProperty(r)) {
						result.push({
							"ID": res.record[r]["ID"],
							"NAME": res.record[r]["NAME"]
						});
					}
				}
			}
		}
		return result;
	};
	/**
	 * 查询动画数据
	 * @return {Array} 返回结果，如果没有查到符合条件的内容，返回空数组
	 * @private
	 */
	var _queryAnimData = function() {
		var result = [];
		var xmlTrackData = earth.UserDocument.LoadXmlFile(xmlAnimListFile + ".xml");
		var res = $.xml2json(xmlTrackData);
		if(res && res.record) {
			if(res.record['ID']) {
				result.push({
					"ID": res.record["ID"],
					"NAME": res.record["NAME"]
				});
			} else {
				for(var r in res.record) {
					if(res.record.hasOwnProperty(r)) {
						result.push({
							"ID": res.record[r]["ID"],
							"NAME": res.record[r]["NAME"]
						});
					}
				}
			}
		}
		return result;
	};

	/**
	 * 获得动态对象，将动态物体和飞行对象分别传入对应的回调函数处理
	 * @param cbDynamicObject 动态物体回调函数
	 * @param cbFlyObject 飞行对象回调函数
	 */
	var _getDynamicObject = function(cbDynamicObject, cbFlyObject, selectObj) {
		earth.Event.OnDynamicListLoaded = function(list) {
			if(list == null){
				//如果没有数据 则该按钮置灰
				if(selectObj && selectObj.val() == null) {
					selectObj.attr("disabled", "disabled");
				}
				return;
			}
			for(var i = 0; i < list.Count; i++) {
				var dynamic = list.Items(i);
				var type = dynamic.Type;
				if((type == "DynamicObject") || (type == "DynamicPeople")) {
					if(cbDynamicObject && typeof cbDynamicObject == "function") {
						cbDynamicObject(dynamic);
					}
				}
				if(cbFlyObject && typeof cbFlyObject == "function") {
					cbFlyObject(dynamic);
				}
			}
			if(list.Count == 0) {
				//如果没有数据 则该按钮置灰
				if(selectObj && selectObj.val() == null) {
					selectObj.attr("disabled", "disabled");
				}
			}
		};
		earth.DynamicSystem.ApplyDynamicList();
	};

	/**
	 * 获取track数组
	 * @return {Array}
	 * @private
	 */
	var _getTracks = function() {
		return _queryData();
	};
	var _getTrackNameById = function(id) {
		var name = "";
		var tracks = _queryData();
		for(var i = 0; i < tracks.length; i++) {
			if(tracks[i]["ID"] == id) {
				name = tracks[i]["NAME"];
				break;
			}
		}
		return name;
	};
	/**
	 * 获取动画数组
	 * @return {Array}
	 * @private
	 */
	var _getAnims = function() {
		return _queryAnimData();
	};
	/**
	 * 往res中添加route里包含的pass集合，使用json格式，符合jquery.zTree插件所需的数据格式
	 * @param res 数组
	 * @param route
	 * @private
	 */
	var _appendStationPass = function(res, route) {
		var pass = null;
		for(var i = 0; i < route.GetChildCount(); i++) {
			pass = route.GetChildAt(i);
			res.push({
				id: pass.Guid,
				name: pass.Name,
				pId: route.Guid,
				icon: "../../images/treeIcons/飞行点.png"
			});
		}
	};
	/**
	 * 获取track中所有对象的内容
	 * @param track
	 * @return {Array} 返回符合jquery.zTree插件所需的数据格式
	 *  [{id: ..., name: ..., pId: ...}, {id: ..., name: ..., pId: ...}, ...]
	 * @private
	 */
	var _getStations = function(track) {
		var result = [];
		var i = 0;
		var station = null;
		while(i < track.GetChildCount()) {
			station = track.GetChildAt(i);
			var nodeIcon = "";
			if(station.Rtti == 502) { //观察点
				nodeIcon = "../../images/treeIcons/观察点.png";
			} else if(station.Rtti == 503) { //503环绕点
				nodeIcon = "../../images/treeIcons/环绕点.png";
			} else {
				nodeIcon = "../../images/treeIcons/folder.png";
			}
			if(station.Name == "pass") {
				result.push({
					id: station.Guid,
					name: station.Name,
					pId: track.Guid,
					open: true,
					icon: nodeIcon
				});
			} else {
				result.push({
					id: station.Guid,
					name: station.Name,
					pId: track.Guid,
					icon: nodeIcon
				});
			}

			if(station.Rtti == 504) { // StationRoute
				_appendStationPass(result, station);
			}
			i += 1;
		}
		return result;

	};
	/**路径初始化
	 * @param {Object} track 飞行路径对象
	 */
	var _getStationsInit = function(track) {
		var result = [];
		var i = 0;
		var station = null;
		while(i < track.GetChildCount()) {
			station = track.GetChildAt(i);
			if(station.Rtti == 502) { //观察点
				nodeIcon = "../../images/treeIcons/观察点.png";
			} else if(station.Rtti == 503) { //503环绕点
				nodeIcon = "../../images/treeIcons/环绕点.png";
			} else {
				nodeIcon = "../../images/treeIcons/folder.png";
			}
			if(station.Name == "pass") {
				result.push({
					id: station.Guid,
					name: station.Name,
					pId: track.Guid,
					open: true,
					icon: nodeIcon
				});
			} else {
				result.push({
					id: station.Guid,
					name: station.Name,
					pId: track.Guid,
					icon: nodeIcon
				});
			}

			if(station.Rtti == 504) { // StationRoute
				_appendStationPass(result, station);
			}
			i += 1;
		}
		return result;
	};

	/**
	 * 根据xml内容，往track对象中添加route
	 * 这里支持多个route 也就是track支持多个pass 2013.10.9
	 * @param track
	 * @param xml
	 * @private
	 */
	var _appendRoute = function(track, xml) {
		//遍历route的个数
		$.each($($.text2xml(xml)).find("Route"), function(r, p) {
			var route = earth.Factory.CreateStationRoute(p.getAttribute("id"), p.getAttribute("name"));

			if(p.getAttribute("Yaw") != null && p.getAttribute("Yaw") != '') {
				route.Yaw = p.getAttribute("Yaw");
			}
			if(p.getAttribute("Pitch") != null && p.getAttribute("Pitch") != '') {
				route.Pitch = p.getAttribute("Pitch");
			}
			if(p.getAttribute("Rate") != null && p.getAttribute("Rate") != '') {
				route.Rate = p.getAttribute("Rate");
			}
			//遍历route里的pass
			var elementList = p.getElementsByTagName("Pass");
			for(var i = 0; i < elementList.length; i++) {
				var passNode = elementList[i];
				var passID = passNode.getAttribute("id");
				var passName = passNode.getAttribute("name");
				var pass = earth.Factory.CreateStationPass(passID, passName);
				pass.Longitude = passNode.getAttribute("Longitude");
				pass.Latitude = passNode.getAttribute("Latitude");
				pass.Altitude = passNode.getAttribute("Altitude");
				route.Yaw = passNode.getAttribute("Heading");
				route.Pitch = passNode.getAttribute("Tilt");
				pass.FlyHeight = passNode.getAttribute("FlyHeight");
				pass.Speed = passNode.getAttribute("Speed");
				route.Rate = passNode.getAttribute("Rate");
				route.AddStation(pass);
			}

			track.AddStation(route);
			track.CommitChanges();
		});
	};
	/**
	 * 根据xml内容，往track对象中添加lookat
	 * @param track
	 * @param xml
	 * @private
	 */
	var _appendLookat = function(track, xml) {
		var $lookat = $($.text2xml(xml)).find("Lookat").first();
		var lookat = earth.Factory.CreateStationLookat($lookat.attr("id"), $lookat.attr("name"));

		lookat.Longitude = $lookat.attr("Longitude");
		lookat.Latitude = $lookat.attr("Latitude");
		lookat.Altitude = $lookat.attr("Altitude");
		lookat.Heading = $lookat.attr("Heading");
		lookat.Tilt = $lookat.attr("Tilt");
		lookat.Roll = $lookat.attr("Roll");
		lookat.range = $lookat.attr("Range");
		lookat.StopTime = $lookat.attr("StopTime");
		track.AddStation(lookat);
		track.CommitChanges();
	};

	/**
	 * 根据xml内容，往track对象中添加surround
	 * @param track
	 * @param xml
	 * @private
	 */
	var _appendSurround = function(track, xml) {
		var $surround = $($.text2xml(xml)).find("Surround").first();
		var surround = earth.Factory.CreateStationSurround($surround.attr("id"), $surround.attr("name"));

		surround.Longitude = $surround.attr("Longitude");
		surround.Latitude = $surround.attr("Latitude");
		surround.Altitude = $surround.attr("Altitude");
		surround.FlyHeight = $surround.attr("FlyHeight");
		surround.Speed = $surround.attr("Speed");
		surround.Radius = $surround.attr("Radius");
		surround.NumberOfCycle = $surround.attr("NumberOfCycle");
		track.AddStation(surround);
		track.CommitChanges();
	};

	/**
	 * 根据id创建track对象
	 * @param id
	 * @param name
	 * @return {*}
	 * @private
	 */
	var _createTrack = function(id, name) {
		var track = earth.Factory.CreateTrack(id, name);
		var xml = earth.UserDocument.LoadXmlFile(xmlTrackListFile + id + ".xml");
		$($.text2xml(xml)).find("Track").first().children().each(function() {
			switch(this.tagName) {
				case "Route":
					_appendRoute(track, this.xml);
					break;
				case "Lookat":
					_appendLookat(track, this.xml);
					break;
				case "Surround":
					_appendSurround(track, this.xml);
					break;
			}
		});
		track.InitFollowTrack(180, 0, 1, 5); // heading, tilt, range_scale, time
		track.CommitChanges();
		track.Visibility = false;
		return track;
	};

	/**
	 * 根据id值，从数据库中查到记录并创建track
	 * @param id
	 * @return {*}
	 * @private
	 */
	var _createTrackFromId = function(id) {
		return _createTrack(id, _getTrackNameById(id));
	};
	/**
	 * 将route及包含的pass点的信息转换为xml格式的字符串表示
	 * @param route
	 * @return {String}
	 * @private
	 */
	var _routeToXml = function(route) {
		var result = [];
		var station = null;
		result.push('<Route id="' + route.Guid + '" name="' + route.Name + '" Rate="' + route.Rate + '" Yaw="' + route.Yaw + '" Pitch="' +
			route.Pitch + '">');
		for(var i = 0; i < route.GetChildCount(); i++) {
			station = route.GetChildAt(i);
			result.push('<Pass id="' + station.Guid +
				'" name="' + station.Name +
				'" Longitude="' + station.Longitude +
				'" Latitude="' + station.Latitude +
				'" Altitude="' + station.Altitude +
				'" Heading="' + route.Yaw +
				'" Tilt="' + route.Pitch +
				'" FlyHeight="' + station.FlyHeight +
				'" Speed="' + station.Speed +
				'" Rate="' + route.Rate +
				'"></Pass>');
		}
		result.push('</Route>');
		return result.join("");
	};
	/**
	 * 将track及包含的各个节点的信息转换为xml格式的字符串表示
	 * @param track
	 * @return {String}
	 * @private
	 */
	var _trackToXml = function(track) {
		var result = [];
		var station = null;
		result.push("<Track>");
		for(var i = 0; i < track.GetChildCount(); i++) {
			station = track.GetChildAt(i);
			switch(station.Rtti) {
				case 502: // lookat
					result.push('<Lookat id="' + station.Guid +
						'" name="' + station.Name +
						'" Longitude="' + station.Longitude +
						'" Latitude="' + station.Latitude +
						'" Altitude="' + station.Altitude +
						'" Heading="' + station.Heading +
						'" Tilt="' + station.Tilt +
						'" Roll="' + station.Roll +
						'" Range="' + station.Range +
						'" StopTime="' + station.StopTime +
						'"></Lookat>');
					break;
				case 503: // surround
					result.push('<Surround id="' + station.Guid +
						'" name="' + station.Name +
						'" Longitude="' + station.Longitude +
						'" Latitude="' + station.Latitude +
						'" Altitude="' + station.Altitude +
						'" FlyHeight="' + station.FlyHeight +
						'" Speed="' + station.Speed +
						'" Radius="' + station.Radius +
						'" NumberOfCycle="' + station.NumberOfCycle +
						'"></Surround>');
					break;
				case 504: // route
					result.push(_routeToXml(station));
					break;
			}
		}
		result.push("</Track>")
		return result.join("");
	};
	/**
	 * 定位到一个节点位置
	 * @param station ISEStation类型
	 * @private
	 */
	var _locateToStation = function(station) {
		switch(station.Rtti) {
			case 502: //lookat
				earth.GlobeObserver.FlytoLookat(station.Longitude, station.Latitude, station.Altitude, station.Heading, station.Tilt, station.Roll, station.range, station.StopTime);
				break;

			case 501: //pass
				earth.GlobeObserver.FlytoLookat(station.Longitude, station.Latitude, station.Altitude, 360, 90, 0, 2000, 4);
				break;

			default:
				earth.GlobeObserver.FlytoLookat(station.Longitude, station.Latitude, station.Altitude, 360, 90, 0, 2000, 4);
				break;
		}
	}
	/**
	 * 定位到track对象（第一个节点位置）
	 * @param track
	 * @private
	 */
	var _locateToTrack = function(track) {
		var station = null;
		if(track && track.GetChildCount() > 0) {
			station = track.GetChildAt(0);
			if(station) {
				if(station.Rtti == 504) { // route
					station = station.GetChildAt(0);
				}
			}
			_locateToStation(station);
		}
	};

	/**保存飞行路径
	 * @param {Object} track 飞行路径
	 */
	var _saveTrack = function(track) {
		earth.UserDocument.SaveXmlFile(xmlTrackListFile + track.Guid, _trackToXml(track));
	};

	/**
	 * 清除所有漫游路线
	 * @private
	 */
	var _clearTracks = function() {
		var tracks = _getTracks();
		var track = null;
		for(var i = 0; i < tracks.length; i++) {
			track = earth.TrackControl.GetTrack(tracks[i]["ID"]);
			if(track) {
				track.Visibility = false;
				//飞行状态时退出处理 暂停时切换页面也停止飞行
				if(track.Status === 1 || track.Status === 2) {
					track.Stop();
				}
				earth.TrackControl.DeleteTrack(tracks[i]["ID"]);

			}
		}
	};
	var _UpdateRate = function(tag, track) {
		if(tag == 0) {
			track.UpdateRate(0); //加速
			track.CommitChanges();
		} else if(tag == 1) {
			track.UpdateRate(1); //减速
			track.CommitChanges();
		}
	}

	/**
	 * 加载动态物体到对应位置
	 * @param dynamicId 动态物体GUID
	 * @param position 球体上的三维位置
	 */
	var _loadDynamicModel = function(dynamicId, position) {
		earth.Event.OnDocumentChanged = function(type) {
			var dynamicObj = earth.DynamicSystem.GetSphericalObject(dynamicId);
			if(dynamicObj == null || position == null) {
				return;
			}
			var heading = earth.GlobeObserver.Pose.Heading;
			dynamicObj.SphericalTransform.SetPose(position.Longitude, position.Latitude, position.Altitude, heading, 0, 0);
			earth.GlobeObserver.InitThirdTrack(180, 15);
			startTracking(dynamicId, 2);
			earth.Event.OnDocumentChanged = function() {};
		};
		earth.DynamicSystem.LoadDynamicObject(dynamicId);
	};
	/**
	 * 开始动态物体漫游
	 * @param dynamicId 动态物体GUID
	 * @param callback
	 */
	var enter = function(dynamicId, callback) {
		earth.Event.OnCreateGeometry = function(position) {
			if(position != null) {
				_loadDynamicModel(dynamicId, position);
				if(callback && typeof callback == "function") {
					callback();
				}
			}
		};
		earth.ShapeCreator.CreatePoint();
	};

	/**
	 * 开始动态物体漫游
	 * @param dynamicId 动态物体GUID
	 * @param callback
	 */
	var enterTrack = function(dynamicId, callback) {
		earth.Event.OnCreateGeometry = function(position) {
			if(position != null) {
				_loadDynamicModel(dynamicId, position);
				if(callback && typeof callback == "function") {
					callback(true);
				}
			} else {
				callback(false);
			}
		};
		earth.ShapeCreator.CreatePoint();
	};

	/**
	 * 退出动态物体漫游
	 * @param dynamicId 动态物体GUID
	 */
	var out = function(dynamicId) {
		earth.GlobeObserver.StopTracking(); //摄像机停止跟随
		earth.GlobeObserver.Stop(); //摄像机停止动作
		if(dynamicId) {
			earth.DynamicSystem.UnLoadDynamicObject(dynamicId); //卸载运动物体对象
		}
	};

	/**
	 * 切换动态物体角色
	 * @param dynamicId 动态物体GUID
	 * @param type 1.第一人称; 2.第三人称; 3.自由
	 */
	var startTracking = function(dynamicId, type, isInDoor) {
		if(isInDoor === true) {
			earth.Environment.SetIsIndoor(true);
		} else {
			earth.Environment.SetIsIndoor(false);
		}
		earth.GlobeObserver.StartTracking(dynamicId, type);
	};
	trackManager.getDynamicObject = _getDynamicObject;
	trackManager.getTracks = _getTracks;
	trackManager.getAnims = _getAnims;
	trackManager.getStations = _getStations;
	trackManager.getStationsInit = _getStationsInit
	trackManager.createTrack = _createTrack;
	trackManager.createTrackFromId = _createTrackFromId;
	trackManager.trackToXml = _trackToXml;
	trackManager.locateToStation = _locateToStation;
	trackManager.locateToTrack = _locateToTrack;
	trackManager.saveTrack = _saveTrack;
	trackManager.clearTracks = _clearTracks;
	trackManager.UpdateRate = _UpdateRate;

	trackManager.enter = enter;
	trackManager.enterTrack = enterTrack;
	trackManager.out = out;
	trackManager.startTracking = startTracking;

	trackManager.sortStation = _sortStation;
	trackManager.sortTrack = _sortTrack;
	return trackManager;
};