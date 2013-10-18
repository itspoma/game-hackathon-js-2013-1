# -*- mode: ruby -*-
# vi: set ft=ruby :

# $ vagrant plugin install vagrant-hostmaster
# $ vagrant gem install vagrant-hostmaster
# $ vagrant plugin list
# $ vagrant hosts

puts "yo"

sites = []
Dir.glob("./sites/*").each do |dir|
  domain = Pathname.new(dir).basename
  sites.push "#{domain}"
end

Vagrant.configure("2") do |config|
  config.vm.box = "hackathon-1"
  config.vm.hostname = "vm-local-web-1"

  # config.vm.box_url = "http://files.vagrantup.com/lucid32.box" # Ubuntu lucid 32
  config.vm.box_url = "http://files.vagrantup.com/precise32.box" # Ubuntu precise 32 VirtualBox

  config.vm.provider :virtualbox do |v|
    v.customize ["modifyvm", :id, "--memory", 1024]
  end

  config.vm.network :private_network, ip: "192.168.10.101"
  # config.vm.network :forwarded_port, guest: 80, host: 8080, auto_correct: true, id: "vm-game-www"
  # config.vm.network :forwarded_port, guest: 22, host: 2222, auto_correct: true, id: "vm-game-vagrant"
  # config.vm.network :forwarded_port, guest: 3000, host: 3000
  config.ssh.forward_agent = true

  nfs_setting = RUBY_PLATFORM =~ /darwin/ || RUBY_PLATFORM =~ /linux/
  config.vm.synced_folder ".", "/var/www", id: "vagrant-root", :nfs => nfs_setting

  config.vm.provision :shell, :path => "vagrant/bash/utf8.sh"

  config.vm.provision :shell, inline: "if ! [ -f /apt-get-run ]; then sudo apt-get update && sudo touch /apt-get-run; fi"

  config.vm.provision :chef_solo do |chef|
    chef.log_level = :debug
    # chef.log_level = :warn  

    chef.cookbooks_path = ["vagrant/chef-cookbooks", "vagrant/app-cookbooks"]

    chef.add_recipe "build-essential"
    chef.add_recipe "openssl"
    chef.add_recipe "apt"
    chef.add_recipe "git"
    chef.add_recipe "mc"
    chef.add_recipe "curl"

    # chef.add_recipe "mongodb"
    # chef.add_recipe "mongodb::default" #??
    # chef.add_recipe "mongodb::logger"
    # chef.add_recipe "mongodb:catalog"

    chef.add_recipe "redis"
    # chef.add_recipe "memcached"

    chef.add_recipe "apache2"
    chef.add_recipe "apache2::mod_php5"
    # chef.add_recipe "apache2::mod_rewrite"
    # chef.add_recipe "apache2::mod_deflate"
    # chef.add_recipe "apache2::mod_headers"
    # chef.add_recipe "apache2::vhosts"

    # chef.add_recipe "mysql"
    # chef.add_recipe "mysql::server"

    chef.add_recipe "nodejs::install_from_package"

    chef.add_recipe "php"
    # chef.add_recipe "php::module_memcache"
    chef.add_recipe "php::module_curl"
    # chef.add_recipe "php::module_mysql"

    # chef.add_recipe "python"

    chef.add_recipe "global"
    chef.add_recipe "sites"

    chef.json = { 
        "sites" => {
            "domains" => sites
        },
        "apache" => {
            "default_site_enabled" => true,
            "docroot_dir" => "/vagrant/sites/default/www",
            "log_dir" => "/vagrant/logs"
        },
        # "mysql" => {
        #     "server_root_password" => "root",
        # },
        "php" => {
            "directives" => {
                "memory_limit" => "256M",
                "error_log" => "/vagrant/logs/php.log",
                "display_errors" => "On",
                "include_path" => ".:/usr/share/pear:/usr/lib64/php/modules/wsf_scripts"
            },
            "version" => "5.4"
        }
    }
  end

  # redis fix
  config.vm.provision :shell, :path => "vagrant/bash/redis.sh"
  
  # npm
  config.vm.provision :shell, :path => "vagrant/bash/npm.sh"

  # rvm
  config.vm.provision :shell, :inline =>
    "if [[ ! -f /rvm-installed ]]; then curl -L https://get.rvm.io | bash && sudo touch /rvm-installed; fi"

  # ruby 2.0
  config.vm.provision :shell, :inline =>
    "if [[ ! -f /ruby-installed ]]; then rvm install 2.0.0 && rvm requirements && sudo touch /ruby-installed; fi"

  config.vm.provision :shell, :inline =>
   "if [[ ! -f /modruby-installed ]]; then apt-get install libapache2-mod-ruby -y && /etc/init.d/apache2 reload && sudo touch /modruby-installed; fi"

  # check dependencies
  config.vm.provision :shell, :path => "vagrant/bash/test.sh"

  config.vm.provision "shell", inline: "echo VM booted successfully!"
end