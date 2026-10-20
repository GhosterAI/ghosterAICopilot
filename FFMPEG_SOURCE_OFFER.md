# FFmpeg source offer

This package includes `ffmpeg/windows/x86_64/ffmpeg.exe`:

- FFmpeg version: `N-124795-gc27a3b12e3-20260604`
- Source commit: `c27a3b12e3`
- License: GPLv3 (the build enables `--enable-gpl --enable-version3`)
- SHA-256: `0A5ECF46B68E11732093A56CDA04E6072BA2C417FD4C9F7940E030F6C3DC6BAA`

## Written offer

For at least three years from the date of this release, the publisher offers to
provide the complete corresponding source code for the FFmpeg binary, including
the build scripts and configuration used to produce it, to anyone who receives
this package. Request it by opening an issue at:

https://github.com/GhosterAI/ghosterAICopilot/issues

Please include the release version (`3.3.5`) and the FFmpeg version string above.
The source is also publicly available from the upstream FFmpeg repository:

```
git clone https://git.ffmpeg.org/ffmpeg.git
cd ffmpeg
git checkout c27a3b12e3
```

The binary was built for Windows x86_64 with mingw-w64. Its `-version` output
contains the full build configuration, including:

```
--prefix=/ffbuild/prefix --pkg-config-flags=--static --pkg-config=pkg-config
--cross-prefix=x86_64-w64-mingw32- --arch=x86_64 --target-os=mingw32
--enable-gpl --enable-version3 --disable-debug --disable-w32threads
--enable-pthreads --enable-iconv --enable-zlib --enable-libxml2
--enable-libvmaf --enable-fontconfig --enable-libharfbuzz
--enable-libfreetype --enable-libfribidi --enable-vulkan --enable-libshaderc
--enable-libvorbis --disable-libxcb --disable-xlib --disable-libpulse
--enable-opencl --enable-gmp --enable-lzma --enable-liblcevc-dec --enable-amf
--enable-libaom --enable-libaribb24 --enable-avisynth --enable-chromaprint
--enable-libdav1d --enable-libdavs2 --enable-libdvdread --enable-libdvdnav
--disable-libfdk-aac --enable-ffnvcodec --enable-cuda-llvm --enable-frei0r
--enable-libgme --enable-libkvazaar --enable-libaribcaption --enable-libass
--enable-libbluray --enable-libjxl --enable-libmp3lame --enable-libopus
--enable-libplacebo --enable-librist --enable-libssh --enable-libtheora
--enable-libvpx --enable-libwebp --enable-libzmq --enable-lv2 --enable-libvpl
--enable-openal --enable-liboapv --enable-libopencore-amrnb
--enable-libopencore-amrwb --enable-libopenh264 --enable-libopenjpeg
--enable-libopenmpt --enable-librav1e --enable-librubberband
--enable-libsnappy --enable-libsoxr --enable-libsrt --enable-libsvtav1
--enable-libtwolame --enable-libuavs3d --disable-libdrm --enable-vaapi
--enable-libvidstab --enable-libvvenc --enable-whisper --enable-libx264
--enable-libx265 --enable-libxavs2 --enable-libxvid --enable-libzimg
--enable-libzvbi --extra-cflags=-DLIBTWOLAME_STATIC --extra-libs=-lgomp
--extra-ldflags=-pthread --cc=x86_64-w64-mingw32-gcc
--cxx=x86_64-w64-mingw32-g++ --ar=x86_64-w64-mingw32-gcc-ar
--ranlib=x86_64-w64-mingw32-gcc-ranlib --nm=x86_64-w64-mingw32-gcc-nm
--extra-version=20260604
```

If the exact source archive is no longer available from the upstream mirror, the
publisher will provide a copy on request through the issue tracker above. This
offer is made under GPLv3 section 6 and is valid for three years from the
release date.

FFmpeg is distributed WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See GPLv3 for details:
https://www.gnu.org/licenses/gpl-3.0.html
