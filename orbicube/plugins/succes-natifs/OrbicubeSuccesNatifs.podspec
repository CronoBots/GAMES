require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'OrbicubeSuccesNatifs'
  s.version = package['version']
  s.summary = package['description']
  s.license = package['license']
  s.homepage = 'https://github.com/CronoBots/GAMES'
  s.author = package['author']
  s.source = { :git => 'https://github.com/CronoBots/GAMES.git', :tag => 'v' + package['version'] }
  s.source_files = 'ios/Sources/**/*.swift'
  s.ios.deployment_target = '15.0'
  s.frameworks = 'GameKit'
  s.dependency 'Capacitor'
  s.swift_version = '5.1'
end
