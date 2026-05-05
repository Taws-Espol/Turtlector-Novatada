{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=25.11";
  };

  outputs =
    { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      devShells.${system}.default = pkgs.stdenv.mkDerivation {
        pname = "dev-env";
        version = "v1.0.0";
        buildInputs = [
          pkgs.nodejs_20
          pkgs.portaudio
          pkgs.ffmpeg
        ];
        shellHook = ''
          export LD_LIBRARY_PATH=${pkgs.portaudio}/lib:$LD_LIBRARY_PATH
        '';
      };
    };
}
