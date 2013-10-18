template '/home/vagrant/.dir_colors' do
    source "dir_colors.erb"
    owner "vagrant"
    group "vagrant"
    mode "0777"
end

template '/etc/apache2/conf.d/ruby.conf' do
    source "ruby.conf"
    owner "vagrant"
    group "vagrant"
    mode "0777"
end