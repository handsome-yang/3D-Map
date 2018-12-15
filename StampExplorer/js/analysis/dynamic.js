/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月07日
 * 描    述：动态组件
 * 注意事项：该文件方法仅为动态组件使用
 * 遗留bug ：无
 * 修改日期：2017年11月07日
 ******************************************************************/
(function(name, context, $) {
	function Dynamic(earth) {
		if (!earth.DynamicSystem) throw ('动态组件加载失败：传入的earth类型错误');
		this.earth = earth;
		this._tracks = {};
	}
	
	function getPoint(p) {
		var point = {};
		point.lon = p.lon || p.Longitude || p.X;
		point.lat = p.lat || p.Latitude || p.Y;
		point.alt = p.alt || p.Altitude || p.Z;
		return point;
	}

	function realTime(track, dMgr) {
		return function(e) {
			if (!track) return;
			switch (e.which) {
				case 187: // '+'
					track.UpdateRate(0);
					track.CommitChanges();
					break;
				case 189: // '-'
					track.UpdateRate(1);
					track.CommitChanges();
					break;
				case 32: // 'space'
					if (track.Status === 1)
						track.Pause();
					else if (track.Status === 2)
						track.Resume();
					break;
			}
		}
	}

	$.extend(Dynamic.prototype, {
		getInstance: function() {
			return this.earth;
		},
		getV3s: function(strCoords) {
			if (strCoords == '') return null;
			var v3s = this.earth.Factory.CreateVector3s(),
				coords = strCoords.split(';'),
				coord, v3, i;
			for (i = 0; i < coords.length; i++) {
				coord = coords[i].split(',');
				v3 = this.earth.Factory.CreateVector3();
				v3.X = coord[0];
				v3.Y = coord[1];
				v3.Z = coord[2];
				v3s.AddVector(v3);
			}
			return v3s;
		},
		getList: function(func) {
			this.earth.Event.OnDynamicListLoaded = function(list) {
				if (typeof func === 'function') {
					func(list);
					return list;
				}
			};
			this.earth.DynamicSystem.ApplyDynamicList();
		},
		getDynamic: function(name, func) {
			this.getList(function(list) {
				if (!list) return;
				var i, len = list.Count,
					dynamic;
				for (i = 0; i < len; i++) {
					dynamic = list.Items(i);
					if (dynamic.Name === name) {
						if (typeof func === 'function') {
							func(dynamic);
							return dynamic;
						}
					}
				}
			});
		},
		roam: function(name, point, func) {
			var self = this;
			if (typeof point === 'function') {
				func = point;
				point = null;
			}
			this.getDynamic(name, function(dynamic) {
				if (point) {
					self.roamAt(dynamic, point, func);
				} else {
					self.earth.Event.OnCreateGeometry = function(pos) {
						self.earth.Event.OnCreateGeometry = $.noop;
						self.earth.ShapeCreator.Clear();
						self.roamAt(dynamic, pos, func);
					};
					self.earth.ShapeCreator.CreatePoint();
				}
			});
		},
		roamAt: function(dynamic, pos, func) {
			var self = this,
				dynamicId = dynamic.Guid;

			self.earth.Event.OnDocumentChanged = function(type) {
				self.earth.Event.OnDocumentChanged = $.noop;
				var dynamicObj = self.earth.DynamicSystem.GetSphericalObject(
						dynamicId),
					heading = self.earth.GlobeObserver.Pose.Heading,
					point;
				if (!dynamicObj || !pos) {
					return;
				}
				point = getPoint(pos);
				dynamicObj.SphericalTransform.SetPose(point.lon, point.lat,
					point.alt, heading, 0, 0);
				self.earth.GlobeObserver.InitThirdTrack(180, 15);
				self.earth.GlobeObserver.StartTracking(dynamicId, 2);
				if (typeof func === 'function')
					func(dynamic, point);
			};
			self.earth.DynamicSystem.LoadDynamicObject(dynamicId);
		},
		stopRoam: function(dynamic) {
			if (dynamic) {
				this.earth.GlobeObserver.StopTracking();
				this.earth.GlobeObserver.Stop();
				this.earth.DynamicSystem.UnLoadDynamicObject(dynamic.Guid);
			}
		},
		track: function(options) { //trackByName
			var self = this,
				name = options.name,
				v3s = options.v3s,
				visible = options.visible,
				flyHeight = options.flyHeight || 0,
				autoClear = options.autoClear,
				cbBefore = options.onBefore,
				cbStart = options.onStart,
				cbFinish = options.onFinish,
				cbEnd = options.onEnd,
				dev = options.dev,
				trackType = options.trackType,
				speed = options.speed,
				doc = options.document || window.document;

			this.getDynamic(name, function(dynamic) {
				if (v3s) {
					self.trackAt(dynamic.Guid, v3s, visible, flyHeight,
						autoClear, cbBefore,
						cbStart, cbFinish, cbEnd, doc, dev, trackType, speed);
				} else {
					self.earth.Event.OnCreateGeometry = function(pos) {
						self.earth.Event.OnCreateGeometry = $.noop;
						
						self.trackAt(dynamic.Guid, pos, visible, flyHeight,
							autoClear, cbBefore, cbStart, cbFinish, cbEnd, doc, dev, trackType, speed);
					};
					self.earth.ShapeCreator.CreatePolyline(2, 0xffE5E632);
				}
			});
		},
		track2: function(options) { //trackById
			var self = this,
				name = options.name,
				dId = options.dId,
				v3s = options.v3s,
				visible = options.visible,
				flyHeight = options.flyHeight || 0,
				autoClear = options.autoClear,
				cbBefore = options.onBefore,
				cbStart = options.onStart,
				cbFinish = options.onFinish,
				cbEnd = options.onEnd,
				dev = options.dev,
				speed = options.speed,
				trackType = options.trackType,
				doc = options.document || window.document;

			if (v3s) {
				self.trackAt(dId, v3s, visible, flyHeight,
					autoClear, cbBefore,
					cbStart, cbFinish, cbEnd, doc, dev, trackType, speed);
			} else {
				self.earth.Event.OnCreateGeometry = function(pos) {
					self.earth.Event.OnCreateGeometry = $.noop;
					
					self.trackAt(dId, pos, visible, flyHeight,
						autoClear, cbBefore, cbStart, cbFinish, cbEnd, doc, dev, trackType, speed);
				};
				self.earth.ShapeCreator.CreatePolyline(2, 0xffE5E632);
			}
		},
		trackAt: function(dynamicId, v3s, visible, flyHeight, autoClear, cbBefore,
			cbStart, cbFinish, cbEnd, doc, dev, trackType, speed) {
			if (!v3s) return;
			if (typeof v3s == 'string') v3s = this.getV3s(v3s);
			var self = this,
				track = self.earth.Factory.CreateTrack(self.earth.Factory.CreateGuid(),
					''),
				count = v3s.Count,
				trackId = track.Guid,
				trackType = trackType || 3,
				funcRealTime = realTime(track, this),
				route, pass, i, pt;
			var coords = '';

			if (count < 2) {
				self.earth.ShapeCreator.Clear();
				return;
			}
			// 两个点时，track没有轨迹，所以留着辅助线作为轨迹线
			if (count !== 2) self.earth.ShapeCreator.Clear();

			// 新建路径
			route = self.earth.Factory.CreateStationRoute(self.earth.Factory.CreateGUID(),
				'');
			// 速度增减值
			route.Rate = 0.01;
			route.Pitch = 0;
			route.Yaw = 0;
			route.RealtimeMode = true;
			for (i = 0; i < count; i++) {
				pt = v3s.Items(i);
				// 新建飞行点，加到路径中
				pass = self.earth.Factory.CreateStationPass(self.earth.Factory.CreateGUID(),
					'');
				pass.Longitude = pt.X;
				pass.Latitude = pt.Y;
				pass.Altitude = pt.Z;
				pass.FlyHeight = flyHeight;
				pass.Speed = speed || 3;
				route.AddStation(pass);
				coords += pt.X + ',' + pt.Y + ',' + pt.Z + ';';
			}
			track.AddStation(route);
			track.Visibility = visible;
			track.CommitChanges();

			self.earth.Event.OnDocumentChanged = function(type, guid) {
				// type=2则加载成功
				if (type !== 2) return;
				self._tracks[trackId] = {
					track: track,
					dynamicId: guid,
					v3s: v3s,
					visible: visible,
					flyHeight: flyHeight,
					autoClear: autoClear,
					cbBefore: cbBefore,
					cbStart: cbStart,
					cbFinish: cbFinish,
					cbEnd: cbEnd,
					document: doc,
					funcRealTime: funcRealTime
				};

				self.earth.Event.OnDocumentChanged = $.noop;
				self.earth.Event.OnTrackFinish = function(tId, dId) {
					var tObj = self._tracks[tId];
					if (tObj) {
						if (typeof tObj.cbFinish === 'function') tObj.cbFinish(tObj.track, dId);
						if (tObj.autoClear) self.deleteTrack(tObj.track);
					}
				};
				track.BindObject = guid;
				self.earth.TrackControl.SetMainTrack(trackId, trackType);
				
				track.CommitChanges();
				if (typeof cbBefore === 'function') cbBefore(track, guid);
				track.Play(false);
				if (typeof cbStart === 'function') cbStart(track, guid);
				$(doc).on('keydown', funcRealTime);
			};
			self.earth.DynamicSystem.LoadDynamicObject(dynamicId);
		},
		stopTrack: function(track) {
			if(!track){
				return;
			}
			if (track.Status != 0) {
				track.Stop();
			}
		},
		deleteTrack: function(track) {
			this.stopTrack(track);
			var tObj = this._tracks[track.Guid];
			if (tObj) {
				this.earth.DynamicSystem.UnLoadDynamicObject(tObj.dynamicId);
				this.earth.GlobeObserver.StopTracking();
				this.earth.GlobeObserver.Stop();
				track.Visibility = false;
				this.earth.TrackControl.DeleteTrack(track.Guid);
				this.earth.ShapeCreator.Clear();
				if (typeof tObj.cbEnd === 'function') tObj.cbEnd();
				delete this._tracks[track.Guid];
				
				$(tObj.document).off('keydown', tObj.funcRealTime);
			}
		},
		pauseTrack: function(curTrack) {
			curTrack.Pause();
		},
		pauseAllTrack: function() {
			var tracks = this._tracks;
			for (var key in tracks) {
				if (tracks.hasOwnProperty(key)) {
					if (tracks[key].track.Status == 1)
						tracks[key].track.Pause();
				}
			}
		},
		resumeAllTrack: function() {
			var tracks = this._tracks;
			for (var key in tracks) {
				if (tracks.hasOwnProperty(key)) {
					if (tracks[key].track.Status == 2)
						tracks[key].track.Resume();
				}
			}
		},
		resumeTrack: function(curTrack) {
			curTrack.Resume();
		},
		stopAllTrack: function() {
			var tracks = this._tracks;
			for (var key in tracks) {
				if (tracks.hasOwnProperty(key)) {
					if (tracks[key].track.Status != 0)
						tracks[key].track.Stop();
				}
			}
		},
		deleteAllTrack: function() {
			var tracks = this._tracks;
			for (var key in tracks) {
				if (tracks.hasOwnProperty(key)) {
					this.deleteTrack(tracks[key].track);
				}
			}
		}
	});

	context.Stamp = context.Stamp || {};
	context.Stamp[name] = Dynamic;
})('Dynamic', this, $);