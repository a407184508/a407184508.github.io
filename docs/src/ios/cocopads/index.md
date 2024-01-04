
# cocoapods 使用指南

## 1. 安装 cocoapods

```bash
sudo gem install cocoapods
```

## 2. 创建 Podfile

```bash
pod init
```

## 3. 编辑 Podfile

```ruby
platform :ios, '8.0'

target 'MyApp' do
  pod 'AFNetworking', '~> 3.1.0'
  pod 'SDWebImage', '~> 3.7.3'
  pod 'MBProgressHUD', '~> 0.9.2'
  pod 'Masonry', '~> 1.0.2'
  pod 'YYText', '~> 1.0.7'
  pod 'YYWebImage', '~> 0.9.3'
  pod 'YYImage', '~> 0.9.6'
  pod 'YYCache', '~> 1.0.4'
  pod 'YYModel', '~> 1.0.4'
  pod 'YYCategories', '~> 1.0.2'
  pod 'YYImagePickerController', '~> 0.9.6'
  pod 'YYWebImage/WebP', '~> 0.9.3'
  pod 'YYImage/WebP', '~> 0.9.6'
  pod 'YYCache/WebP', '~> 1.0.4'
  pod 'YYModel/WebP', '~> 1.0.4'
  pod 'YYCategories/WebP', '~> 1.0.2'
  pod 'YYImagePickerController/WebP', '~> 0.9.6'
end
```

## 4. 安装依赖

```bash
pod install
```

## 5. 导入依赖

```objective-c
#import <AFNetworking/AFNetworking.h>
#import <SDWebImage/UIImageView+WebCache.h>
#import <MBProgressHUD/MBProgressHUD.h>
#import <Masonry/Masonry.h>
#import <YYText/YYText.h>
#import <YYWebImage/YYWebImage.h>
#import <YYImage/YYImage.h>
#import <YYCache/YYCache.h>
#import <YYModel/YYModel.h>
#import <YYCategories/YYCategories.h>
#import <YYImagePickerController/YYImagePickerController.h>
#import <YYWebImage/YYWebImageWebP.h>
#import <YYImage/YYImageWebP.h>
#import <YYCache/YYCacheWebP.h>
#import <YYModel/YYModelWebP.h>
#import <YYCategories/YYCategoriesWebP.h>
#import <YYImagePickerController/YYImagePickerControllerWebP.h>
```

## 6. 注意事项

- 注意 `pod install` 后，`Pods` 文件夹下会生成 `Pods.xcodeproj` 文件，打开该文件，在 `Build Settings` -> `Header Search Paths` 中添加 `$(SRCROOT)/Pods/Headers/Public` 和 `$(SRCROOT)/Pods/Headers/Public/YYImagePickerControllerWebP` 路径，否则编译时会报错。
- 注意 `pod install` 后，`Pods` 文件夹下会生成 `Pods.xcodeproj` 文件，打开该文件，在 `Build Settings` -> `Other Linker Flags` 中添加 `-ObjC` 选项，否则编译时会

## 7. 卸载 cocoapods

```bash
sudo gem uninstall cocoapods
```


## 其他: Cocoapods更换国内的源

```bash 
pod repo remove master

pod add master --sources='https://github.com/CocoaPods/Specs.git,https://github.com/CocoaPods/Specs.git'

pod add YYImagePickerControllerWebP --sources='https://github.com/CocoaPods/Specs.git,https://github.com/CocoaPods/Specs.git'

pod add taobao --sources='https://github.com/CocoaPods/Specs.git,https://github.com/CocoaPods/Specs.git'

pod repo update
```