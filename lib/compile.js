module.exports = function (__$expr__) {
	if (/^[_$][\w$]*$/.test(__$expr__)) {
		// access property if begin with _ or $
		return function ($scope) {
			return $scope[__$expr__]
		}
	} else {
		return new Function('$scope', 'with($scope){return (' + __$expr__ + ')}')
	}
}