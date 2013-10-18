require 'pathname'

node['sites']['domains'].each do |domain|
    puts "!!!!! ADDED DOMAIN: #{domain}"

    web_app "#{domain}" do
      server_name "#{domain}.local.v"
      template "web_app.conf.erb"
      server_aliases ["#{domain}.vagrant"]
      docroot "/vagrant/sites/#{domain}/www"
      directory_index ["index.php", "index.html"]
      enable true
    end
    
    directory domain do
        owner "vagrant"
        group "vagrant"
        mode "0777"
    end
end